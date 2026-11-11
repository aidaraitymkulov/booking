import { describe, expect, it } from 'vitest'

import {
  findConflict,
  hasOverlap,
  rangesOverlap,
  validateBooking,
  type BookingIssue,
} from './rules'
import type { Booking, BookingDraft } from './types'

const NOW = new Date(2026, 10, 10, 12, 0)
const TODAY = '2026-11-10'
const FUTURE = '2026-11-11'

const draft = (overrides: Partial<BookingDraft> = {}): BookingDraft => ({
  date: FUTURE,
  start: '10:00',
  end: '11:00',
  ...overrides,
})

const booking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'b1',
  date: FUTURE,
  start: '10:00',
  end: '11:00',
  ...overrides,
})

const issuesOf = (value: BookingDraft): BookingIssue[] =>
  validateBooking(value, NOW)

describe('validateBooking', () => {
  it('accepts a valid booking', () => {
    expect(issuesOf(draft())).toEqual([])
  })

  describe('working hours (09:00-18:00)', () => {
    it('accepts the exact boundaries', () => {
      expect(issuesOf(draft({ start: '09:00', end: '10:00' }))).toEqual([])
      expect(issuesOf(draft({ start: '16:00', end: '18:00' }))).toEqual([])
    })

    it('rejects start before 09:00', () => {
      expect(issuesOf(draft({ start: '08:30', end: '09:30' }))).toEqual([
        { field: 'start', code: 'OUTSIDE_WORKING_HOURS' },
      ])
    })

    it('rejects end after 18:00', () => {
      expect(issuesOf(draft({ start: '17:30', end: '18:30' }))).toEqual([
        { field: 'end', code: 'OUTSIDE_WORKING_HOURS' },
      ])
    })

    it('rejects a start after 18:00', () => {
      expect(issuesOf(draft({ start: '19:00', end: '20:00' }))).toEqual([
        { field: 'start', code: 'OUTSIDE_WORKING_HOURS' },
        { field: 'end', code: 'OUTSIDE_WORKING_HOURS' },
      ])
    })
  })

  describe('start < end', () => {
    it('rejects end equal to start', () => {
      expect(issuesOf(draft({ start: '10:00', end: '10:00' }))).toEqual([
        { field: 'end', code: 'END_NOT_AFTER_START' },
      ])
    })

    it('rejects end before start', () => {
      expect(issuesOf(draft({ start: '11:00', end: '10:00' }))).toEqual([
        { field: 'end', code: 'END_NOT_AFTER_START' },
      ])
    })
  })

  describe('duration (30 min - 2 h)', () => {
    it('accepts exactly 30 minutes and exactly 2 hours', () => {
      expect(issuesOf(draft({ start: '10:00', end: '10:30' }))).toEqual([])
      expect(issuesOf(draft({ start: '10:00', end: '12:00' }))).toEqual([])
    })

    it('rejects less than 30 minutes', () => {
      expect(issuesOf(draft({ start: '10:00', end: '10:29' }))).toEqual([
        { field: 'end', code: 'TOO_SHORT' },
      ])
    })

    it('rejects more than 2 hours', () => {
      expect(issuesOf(draft({ start: '10:00', end: '12:01' }))).toEqual([
        { field: 'end', code: 'TOO_LONG' },
      ])
    })
  })

  describe('past', () => {
    it('rejects a past date', () => {
      expect(issuesOf(draft({ date: '2026-11-09' }))).toEqual([
        { field: 'date', code: 'PAST_DATE' },
      ])
    })

    it('rejects a slot that already started today', () => {
      expect(
        issuesOf(draft({ date: TODAY, start: '11:00', end: '12:30' })),
      ).toEqual([{ field: 'start', code: 'PAST_TIME' }])
    })

    it('accepts a slot starting exactly now', () => {
      expect(
        issuesOf(draft({ date: TODAY, start: '12:00', end: '13:00' })),
      ).toEqual([])
    })

    it('accepts a later slot today', () => {
      expect(
        issuesOf(draft({ date: TODAY, start: '15:00', end: '16:00' })),
      ).toEqual([])
    })

    it('does not treat early slots as past on a future date', () => {
      expect(
        issuesOf(draft({ date: FUTURE, start: '09:00', end: '10:00' })),
      ).toEqual([])
    })

    it('uses the local date right after midnight', () => {
      const justAfterMidnight = new Date(2026, 10, 10, 0, 5)
      expect(
        validateBooking(
          draft({ date: TODAY, start: '09:00', end: '10:00' }),
          justAfterMidnight,
        ),
      ).toEqual([])
      expect(
        validateBooking(draft({ date: '2026-11-09' }), justAfterMidnight),
      ).toEqual([{ field: 'date', code: 'PAST_DATE' }])
    })
  })

  describe('malformed input', () => {
    it('reports an invalid date and skips the past check', () => {
      expect(issuesOf(draft({ date: '2026-02-30' }))).toEqual([
        { field: 'date', code: 'INVALID_DATE' },
      ])
    })

    it('reports invalid times and skips range checks', () => {
      expect(issuesOf(draft({ start: '9:00', end: 'abc' }))).toEqual([
        { field: 'start', code: 'INVALID_TIME' },
        { field: 'end', code: 'INVALID_TIME' },
      ])
    })

    it('still validates the valid half when one time is malformed', () => {
      expect(issuesOf(draft({ start: '07:00', end: '25:00' }))).toEqual([
        { field: 'end', code: 'INVALID_TIME' },
        { field: 'start', code: 'OUTSIDE_WORKING_HOURS' },
      ])
    })
  })
})

describe('rangesOverlap', () => {
  const range = (start: number, end: number) => ({ start, end })

  it('detects a partial overlap in both directions', () => {
    expect(rangesOverlap(range(600, 720), range(660, 780))).toBe(true)
    expect(rangesOverlap(range(660, 780), range(600, 720))).toBe(true)
  })

  it('detects containment and identical ranges', () => {
    expect(rangesOverlap(range(600, 780), range(630, 690))).toBe(true)
    expect(rangesOverlap(range(630, 690), range(600, 780))).toBe(true)
    expect(rangesOverlap(range(600, 660), range(600, 660))).toBe(true)
  })

  it('allows touching boundaries', () => {
    expect(rangesOverlap(range(600, 660), range(660, 720))).toBe(false)
    expect(rangesOverlap(range(660, 720), range(600, 660))).toBe(false)
  })

  it('allows disjoint ranges', () => {
    expect(rangesOverlap(range(600, 660), range(720, 780))).toBe(false)
  })
})

describe('findConflict / hasOverlap', () => {
  const existing = [booking({ id: 'b1', start: '10:00', end: '11:00' })]

  it('finds the conflicting booking', () => {
    const conflict = findConflict(
      draft({ start: '10:30', end: '11:30' }),
      existing,
    )
    expect(conflict?.id).toBe('b1')
    expect(hasOverlap(draft({ start: '10:30', end: '11:30' }), existing)).toBe(
      true,
    )
  })

  it('allows a draft touching the end of an existing booking', () => {
    expect(hasOverlap(draft({ start: '11:00', end: '12:00' }), existing)).toBe(
      false,
    )
  })

  it('allows a draft touching the start of an existing booking', () => {
    expect(hasOverlap(draft({ start: '09:00', end: '10:00' }), existing)).toBe(
      false,
    )
  })

  it('ignores bookings on other dates', () => {
    expect(hasOverlap(draft({ date: '2026-11-12' }), existing)).toBe(false)
  })

  it('returns undefined and false for an empty list', () => {
    expect(findConflict(draft(), [])).toBeUndefined()
    expect(hasOverlap(draft(), [])).toBe(false)
  })

  describe('editing (excludeId)', () => {
    it('does not conflict with itself', () => {
      expect(
        hasOverlap(draft({ start: '10:00', end: '11:30' }), existing, 'b1'),
      ).toBe(false)
    })

    it('without excludeId the same change conflicts with itself', () => {
      expect(
        hasOverlap(draft({ start: '10:00', end: '11:30' }), existing),
      ).toBe(true)
    })

    it('still conflicts with another booking', () => {
      const bookings = [
        ...existing,
        booking({ id: 'b2', start: '11:00', end: '12:00' }),
      ]
      const conflict = findConflict(
        draft({ start: '10:00', end: '11:30' }),
        bookings,
        'b1',
      )
      expect(conflict?.id).toBe('b2')
    })
  })
})
