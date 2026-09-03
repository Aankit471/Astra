/**
 * ASTRA UI Types
 * Shared types for component props and UI state.
 */

import type { ReactNode } from 'react'

// ── Common ─────────────────────────────────────────────────────────────────

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type ColorVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'critical'
  | 'danger'
  | 'info'
  | 'muted'

export interface BaseProps {
  className?: string
  children?: ReactNode
}

// ── Navigation ─────────────────────────────────────────────────────────────

export interface NavItem {
  label: string
  path: string
  icon?: ReactNode
  badge?: number | string
  isActive?: boolean
  children?: NavItem[]
}

// ── Table ──────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: keyof T | string
  header: string
  width?: string
  sortable?: boolean
  render?: (value: unknown, row: T) => ReactNode
}

export interface SortState {
  key: string
  direction: 'asc' | 'desc'
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

// ── Filter ─────────────────────────────────────────────────────────────────

export interface FilterOption {
  label: string
  value: string
  count?: number
}

// ── Toast / Notification ───────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number   // ms, 0 = persistent
  action?: {
    label: string
    onClick: () => void
  }
}

// ── Modal ──────────────────────────────────────────────────────────────────

export interface ModalState {
  isOpen: boolean
  title?: string
  content?: ReactNode
  onConfirm?: () => void
  onCancel?: () => void
  confirmLabel?: string
  cancelLabel?: string
  isDangerous?: boolean
}

// ── Offline ────────────────────────────────────────────────────────────────

export interface OfflineState {
  isOnline: boolean
  lastSyncedAt: string | null   // ISO 8601
}

// ── Loading / Async ────────────────────────────────────────────────────────

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  status: AsyncStatus
  data: T | null
  error: string | null
}

// ── Breadcrumb ─────────────────────────────────────────────────────────────

export interface Breadcrumb {
  label: string
  path?: string
}

// ── Step (Wizard) ──────────────────────────────────────────────────────────

export interface WizardStep {
  id: string
  label: string
  description?: string
  isCompleted: boolean
  isActive: boolean
  isDisabled: boolean
}
