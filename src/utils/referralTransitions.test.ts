import { describe, expect, it } from 'vitest'
import { AppError } from '@/api/errors'
import { assertTransition, canTransition } from './referralTransitions'

describe('referral transitions', () => {
  it('allows the supported lifecycle transitions', () => {
    expect(canTransition('CREATED', 'MATCHING')).toBe(true)
    expect(canTransition('MATCHING', 'MATCHED')).toBe(true)
    expect(canTransition('MATCHED', 'WAITING_FOR_RESPONSE')).toBe(true)
    expect(canTransition('WAITING_FOR_RESPONSE', 'REVIEWING')).toBe(true)
    expect(canTransition('REVIEWING', 'DECLINED')).toBe(true)
    expect(canTransition('DECLINED', 'ESCALATED')).toBe(true)
    expect(canTransition('ACCEPTED', 'CONFIRMED')).toBe(true)
    expect(canTransition('COMPLETED', 'ACCEPTED')).toBe(false)
  })

  it('returns a controlled conflict for invalid transitions', () => {
    expect(() => assertTransition('ARRIVED', 'CREATED')).toThrowError(AppError)
    expect(() => assertTransition('COMPLETED', 'ACCEPTED')).toThrow('Invalid referral transition')
  })
})