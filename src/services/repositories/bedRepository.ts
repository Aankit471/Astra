import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import MockDatabase from '@/services/mock/mockDb'
import type { BedAvailability, BedCategory, ComfortType, RoomType, ClinicalSupportType } from '@/types/domain'
import { auditRepository } from './auditRepository'

export interface BedActor {
  id: string
  name: string
  role: string
}

export interface BedCountsPayload {
  totalBeds: number
  availableBeds: number
  occupiedBeds: number
  reservedBeds: number
  pricePerDay?: number
}

function mapBedCategory(bedType: string): BedCategory {
  const normalized = bedType?.toUpperCase() || ''
  if (normalized.includes('ICU') || normalized.includes('INTENSIVE')) return 'ICU'
  if (normalized.includes('HDU') || normalized.includes('DEPENDENCY')) return 'HDU'
  if (normalized.includes('EMERG') || normalized.includes('CASUALTY')) return 'EMERGENCY'
  if (normalized.includes('SEMI')) return 'SEMI_PRIVATE'
  if (normalized.includes('PRIVATE') || normalized.includes('SUITE')) return 'PRIVATE'
  if (normalized.includes('ISOL')) return 'ISOLATION'
  if (normalized.includes('CRITICAL')) return 'CRITICAL_CARE'
  return 'GENERAL'
}

export const bedRepository = {
  /**
   * Get beds for a given hospital from Supabase hospital_beds table.
   */
  async getByHospitalId(hospitalId: string): Promise<BedAvailability[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('hospital_beds')
          .select('*')
          .eq('hospital_id', hospitalId)
          .order('ward_name', { ascending: true })

        if (!error && data && data.length > 0) {
          return data.map((b: any) => {
            const total = Number(b.total_beds ?? 0)
            const available = Number(b.available_beds ?? 0)
            const occupied = Number(b.occupied_beds ?? 0)
            const reserved = Number(b.reserved_beds ?? 0)
            const price = b.price_per_day ? Number(b.price_per_day) : undefined

            return {
              id: b.id,
              hospitalId: b.hospital_id,
              category: mapBedCategory(b.bed_type || b.category),
              roomType: (b.room_type || 'SHARED') as RoomType,
              comfort: (b.ac_non_ac === 'NON_AC' ? 'NON_AC' : 'AC') as ComfortType,
              clinicalSupport: (b.clinical_support || 'STANDARD') as ClinicalSupportType,
              totalBeds: total,

              availableBeds: available,
              occupiedBeds: occupied,
              reservedBeds: reserved,
              availabilityStatus: available > 0 ? (available <= 2 ? 'LIMITED' : 'AVAILABLE') : 'FULL',
              verificationStatus: b.verification_status || 'VERIFIED',
              lastUpdatedAt: b.last_updated || new Date().toISOString(),
              source: b.source || 'Hospital Operations Telemetry',
              chargePerDay: price,
              chargeFormatted: price !== undefined ? `₹${price.toLocaleString()} / day` : undefined,
              notes: b.ward_name,
            }
          })
        }
      } catch (err) {
        console.warn('Supabase bed fetch failed, using mock fallback:', err)
      }
    }

    const hospital = MockDatabase.getInstance().getHospitalById(hospitalId)
    return hospital?.capabilities.beds || []
  },

  /**
   * Allocate a bed (+1 occupied, -1 available).
   */
  async allocateBed(
    hospitalId: string,
    bedId: string,
    actor: BedActor
  ): Promise<{ success: boolean; error?: string }> {
    const beds = await this.getByHospitalId(hospitalId)
    const target = beds.find((b) => b.id === bedId)
    if (!target) {
      return { success: false, error: `Bed ${bedId} not found.` }
    }

    if (target.availableBeds <= 0) {
      return { success: false, error: 'No available beds left in this category to allocate.' }
    }

    const newAvailable = target.availableBeds - 1
    const newOccupied = target.occupiedBeds + 1

    return this.updateBedCounts(
      hospitalId,
      bedId,
      {
        totalBeds: target.totalBeds,
        availableBeds: newAvailable,
        occupiedBeds: newOccupied,
        reservedBeds: target.reservedBeds || 0,
      },
      actor,
      'BED_ALLOCATED'
    )
  },

  /**
   * Release an occupied bed (-1 occupied, +1 available).
   */
  async releaseBed(
    hospitalId: string,
    bedId: string,
    actor: BedActor
  ): Promise<{ success: boolean; error?: string }> {
    const beds = await this.getByHospitalId(hospitalId)
    const target = beds.find((b) => b.id === bedId)
    if (!target) {
      return { success: false, error: `Bed ${bedId} not found.` }
    }

    if (target.occupiedBeds <= 0) {
      return { success: false, error: 'No occupied beds left in this category to release.' }
    }

    const newAvailable = target.availableBeds + 1
    const newOccupied = target.occupiedBeds - 1

    return this.updateBedCounts(
      hospitalId,
      bedId,
      {
        totalBeds: target.totalBeds,
        availableBeds: newAvailable,
        occupiedBeds: newOccupied,
        reservedBeds: target.reservedBeds || 0,
      },
      actor,
      'BED_RELEASED'
    )
  },

  /**
   * Reserve an available bed (+1 reserved, -1 available).
   */
  async reserveBed(
    hospitalId: string,
    bedId: string,
    actor: BedActor
  ): Promise<{ success: boolean; error?: string }> {
    const beds = await this.getByHospitalId(hospitalId)
    const target = beds.find((b) => b.id === bedId)
    if (!target) {
      return { success: false, error: `Bed ${bedId} not found.` }
    }

    if (target.availableBeds <= 0) {
      return { success: false, error: 'No available beds left in this category to reserve.' }
    }

    const newAvailable = target.availableBeds - 1
    const newReserved = (target.reservedBeds || 0) + 1

    return this.updateBedCounts(
      hospitalId,
      bedId,
      {
        totalBeds: target.totalBeds,
        availableBeds: newAvailable,
        occupiedBeds: target.occupiedBeds,
        reservedBeds: newReserved,
      },

      actor,
      'BED_RESERVED'
    )
  },

  /**
   * Update bed capacity counts with strict validation constraint:
   * (available + occupied + reserved) <= total and no negative values.
   */
  async updateBedCounts(
    hospitalId: string,
    bedId: string,
    counts: BedCountsPayload,
    actor: BedActor,
    actionName = 'BED_CAPACITY_UPDATED'
  ): Promise<{ success: boolean; error?: string }> {
    const { totalBeds, availableBeds, occupiedBeds, reservedBeds, pricePerDay } = counts

    // Validation: prevent negative values
    if (totalBeds < 0 || availableBeds < 0 || occupiedBeds < 0 || reservedBeds < 0) {
      return { success: false, error: 'Bed numbers cannot be negative.' }
    }

    // Validation: available + occupied + reserved MUST NOT exceed total
    const sum = availableBeds + occupiedBeds + reservedBeds
    if (sum > totalBeds) {
      return {
        success: false,
        error: `Validation Error: Available (${availableBeds}) + Occupied (${occupiedBeds}) + Reserved (${reservedBeds}) = ${sum}, which exceeds Total Beds (${totalBeds}).`,
      }
    }

    const status = availableBeds === 0 ? 'FULL' : availableBeds <= 2 ? 'LIMITED' : 'AVAILABLE'
    const timestamp = new Date().toISOString()

    if (isSupabaseConfigured()) {
      try {
        const updatePayload: Record<string, any> = {
          total_beds: totalBeds,
          available_beds: availableBeds,
          occupied_beds: occupiedBeds,
          reserved_beds: reservedBeds,
          status,
          last_updated: timestamp,
        }
        if (pricePerDay !== undefined) {
          updatePayload.price_per_day = pricePerDay
        }

        const { error } = await supabase
          .from('hospital_beds')
          .update(updatePayload)
          .eq('id', bedId)

        if (!error) {
          await auditRepository.log({
            action: actionName,
            actorId: actor.id,
            actorName: actor.name,
            actorRole: actor.role,
            targetType: 'HOSPITAL',
            targetId: hospitalId,
            targetLabel: `Bed #${bedId}`,
            details: { bedId, counts, previousSum: sum },
          })
          return { success: true }
        }
        console.warn('Supabase bed update returned error:', error)
      } catch (err: any) {
        console.warn('Supabase bed update failed, falling back to mock:', err)
      }
    }

    // Mock fallback update
    const mockSuccess = MockDatabase.getInstance().updateHospitalBedConfig(hospitalId, bedId, {
      totalBeds,
      availableBeds,
      occupiedBeds,
      chargePerDay: pricePerDay,
    })

    if (mockSuccess) {
      await auditRepository.log({
        action: actionName,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        targetType: 'HOSPITAL',
        targetId: hospitalId,
        targetLabel: `Bed #${bedId}`,
        details: { bedId, counts, mode: 'OFFLINE_FALLBACK' },
      })
      return { success: true }
    }

    return { success: false, error: 'Failed to update bed capacity in database.' }
  },

  /**
   * Backwards-compatible legacy updater
   */
  async updateBedAvailability(
    hospitalId: string,
    bedId: string,
    availableBeds: number,
    occupiedBeds: number
  ): Promise<boolean> {
    const safeAvail = Math.max(0, availableBeds)
    const safeOcc = Math.max(0, occupiedBeds)
    const total = Math.max(safeAvail + safeOcc, 1)

    const res = await this.updateBedCounts(
      hospitalId,
      bedId,
      { totalBeds: total, availableBeds: safeAvail, occupiedBeds: safeOcc, reservedBeds: 0 },
      { id: 'ops-001', name: 'Hospital Operations', role: 'HOSPITAL_OPS' }
    )
    return res.success
  },
}
