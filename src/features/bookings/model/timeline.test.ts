import { describe, expect, it } from 'vitest'

import { WORK_END, WORK_START } from './constants'
import { getFirstFreeSlot, getPastEnd, isSlotAvailable } from './timeline'
import type { Booking } from './types'

const TODAY = '2026-11-10'
const FUTURE = '2026-11-11'
const PAST = '2026-11-09'
const NOON = new Date(2026, 10, 10, 12, 0)

const booking = (start: string, end: string, date = FUTURE): Booking => ({
  id: `${date}-${start}`,
  date,
  start,
  end,
})

describe('isSlotAvailable', () => {
  it('is false for a slot inside a booking', () => {
    const bookings = [booking('10:00', '11:00')]

    expect(isSlotAvailable(FUTURE, 10 * 60, bookings, NOON)).toBe(false)
    expect(isSlotAvailable(FUTURE, 10 * 60 + 30, bookings, NOON)).toBe(false)
  })

  it('is true for slots that only touch a booking', () => {
    const bookings = [booking('10:00', '11:00')]

    expect(isSlotAvailable(FUTURE, 9 * 60 + 30, bookings, NOON)).toBe(true)
    expect(isSlotAvailable(FUTURE, 11 * 60, bookings, NOON)).toBe(true)
  })

  it('ignores bookings of other dates', () => {
    const bookings = [booking('10:00', '11:00', '2026-11-12')]

    expect(isSlotAvailable(FUTURE, 10 * 60, bookings, NOON)).toBe(true)
  })

  it('is false for elapsed slots today and true for later ones', () => {
    expect(isSlotAvailable(TODAY, 11 * 60 + 30, [], NOON)).toBe(false)
    expect(isSlotAvailable(TODAY, 12 * 60, [], NOON)).toBe(true)
  })

  it('is false for every slot of a past date', () => {
    expect(isSlotAvailable(PAST, 15 * 60, [], NOON)).toBe(false)
  })
})

describe('getFirstFreeSlot', () => {
  it('returns the start of the working day when nothing is booked', () => {
    expect(getFirstFreeSlot(FUTURE, [], NOON)).toBe('09:00')
  })

  it('skips booked time', () => {
    expect(getFirstFreeSlot(FUTURE, [booking('09:00', '10:30')], NOON)).toBe(
      '10:30',
    )
  })

  it('treats a booking that only touches the slot as free', () => {
    expect(getFirstFreeSlot(FUTURE, [booking('09:00', '09:30')], NOON)).toBe(
      '09:30',
    )
  })

  it('starts from the current slot today', () => {
    expect(getFirstFreeSlot(TODAY, [], NOON)).toBe('12:00')
  })

  it('starts from the next slot once the current one has begun', () => {
    expect(getFirstFreeSlot(TODAY, [], new Date(2026, 10, 10, 12, 10))).toBe(
      '12:30',
    )
  })

  it('returns undefined after working hours', () => {
    expect(getFirstFreeSlot(TODAY, [], new Date(2026, 10, 10, 18, 0))).toBe(
      undefined,
    )
  })

  it('returns undefined for a past date', () => {
    expect(getFirstFreeSlot(PAST, [], NOON)).toBe(undefined)
  })

  it('returns undefined when the whole day is booked', () => {
    const bookings = [
      booking('09:00', '11:00'),
      booking('11:00', '13:00'),
      booking('13:00', '15:00'),
      booking('15:00', '17:00'),
      booking('17:00', '18:00'),
    ]

    expect(getFirstFreeSlot(FUTURE, bookings, NOON)).toBe(undefined)
  })
})

describe('getPastEnd', () => {
  it('covers the whole day for a past date', () => {
    expect(getPastEnd(PAST, NOON)).toBe(WORK_END)
  })

  it('covers nothing for a future date', () => {
    expect(getPastEnd(FUTURE, NOON)).toBe(WORK_START)
  })

  it('ends at the next slot boundary today', () => {
    expect(getPastEnd(TODAY, NOON)).toBe(12 * 60)
    expect(getPastEnd(TODAY, new Date(2026, 10, 10, 12, 10))).toBe(12 * 60 + 30)
  })

  it('is clamped to working hours', () => {
    expect(getPastEnd(TODAY, new Date(2026, 10, 10, 7, 0))).toBe(WORK_START)
    expect(getPastEnd(TODAY, new Date(2026, 10, 10, 19, 0))).toBe(WORK_END)
  })
})
