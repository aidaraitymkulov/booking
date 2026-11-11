import { MAX_DURATION, MIN_DURATION, WORK_END, WORK_START } from './constants'
import {
  getNowMinutes,
  getTodayLocal,
  isValidDate,
  isValidTime,
  toHHmm,
  toMinutes,
} from './time'
import type { Booking, BookingDraft } from './types'

export type BookingIssueField = 'date' | 'start' | 'end'

export type BookingIssueCode =
  | 'INVALID_DATE'
  | 'INVALID_TIME'
  | 'OUTSIDE_WORKING_HOURS'
  | 'END_NOT_AFTER_START'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'PAST_DATE'
  | 'PAST_TIME'

export type BookingIssue = {
  field: BookingIssueField
  code: BookingIssueCode
}

export type TimeRange = {
  start: number
  end: number
}

export const validateBooking = (
  draft: BookingDraft,
  now: Date = new Date(),
): BookingIssue[] => {
  const issues: BookingIssue[] = []

  const isDateValid = isValidDate(draft.date)
  const start = isValidTime(draft.start) ? toMinutes(draft.start) : null
  const end = isValidTime(draft.end) ? toMinutes(draft.end) : null

  if (!isDateValid) issues.push({ field: 'date', code: 'INVALID_DATE' })
  if (start === null) issues.push({ field: 'start', code: 'INVALID_TIME' })
  if (end === null) issues.push({ field: 'end', code: 'INVALID_TIME' })

  if (start !== null && (start < WORK_START || start > WORK_END)) {
    issues.push({ field: 'start', code: 'OUTSIDE_WORKING_HOURS' })
  }
  if (end !== null && (end < WORK_START || end > WORK_END)) {
    issues.push({ field: 'end', code: 'OUTSIDE_WORKING_HOURS' })
  }

  if (start !== null && end !== null) {
    if (end <= start) {
      issues.push({ field: 'end', code: 'END_NOT_AFTER_START' })
    } else if (end - start < MIN_DURATION) {
      issues.push({ field: 'end', code: 'TOO_SHORT' })
    } else if (end - start > MAX_DURATION) {
      issues.push({ field: 'end', code: 'TOO_LONG' })
    }
  }

  if (isDateValid) {
    const today = getTodayLocal(now)
    if (draft.date < today) {
      issues.push({ field: 'date', code: 'PAST_DATE' })
    } else if (
      draft.date === today &&
      start !== null &&
      start < getNowMinutes(now)
    ) {
      issues.push({ field: 'start', code: 'PAST_TIME' })
    }
  }

  return issues
}

export const rangesOverlap = (a: TimeRange, b: TimeRange): boolean =>
  a.start < b.end && b.start < a.end

const toRange = ({ start, end }: Pick<BookingDraft, 'start' | 'end'>) => ({
  start: toMinutes(start),
  end: toMinutes(end),
})

export const findConflict = (
  draft: BookingDraft,
  bookings: Booking[],
  excludeId?: string,
): Booking | undefined => {
  const range = toRange(draft)
  return bookings.find(
    (booking) =>
      booking.id !== excludeId &&
      booking.date === draft.date &&
      rangesOverlap(range, toRange(booking)),
  )
}

export const hasOverlap = (
  draft: BookingDraft,
  bookings: Booking[],
  excludeId?: string,
): boolean => findConflict(draft, bookings, excludeId) !== undefined

export const getDefaultEnd = (start: string): string =>
  toHHmm(Math.min(toMinutes(start) + 60, WORK_END))
