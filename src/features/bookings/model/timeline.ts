import { SLOT_MINUTES, WORK_END, WORK_START } from './constants'
import { hasOverlap, validateBooking } from './rules'
import { getNowMinutes, getTodayLocal, toHHmm } from './time'
import type { Booking } from './types'

const HOUR_HEIGHT = 64
const PX_PER_MINUTE = HOUR_HEIGHT / 60

export const TIMELINE_HEIGHT = (WORK_END - WORK_START) * PX_PER_MINUTE

export const SLOT_STARTS = Array.from(
  { length: (WORK_END - WORK_START) / SLOT_MINUTES },
  (_, index) => WORK_START + index * SLOT_MINUTES,
)

export const HOUR_MARKS = Array.from(
  { length: (WORK_END - WORK_START) / 60 + 1 },
  (_, index) => WORK_START + index * 60,
)

export const getTop = (minutes: number) =>
  (minutes - WORK_START) * PX_PER_MINUTE

export const getHeight = (minutes: number) => minutes * PX_PER_MINUTE

export const getSlot = (date: string, startMinutes: number) => ({
  date,
  start: toHHmm(startMinutes),
  end: toHHmm(startMinutes + SLOT_MINUTES),
})

export const isSlotAvailable = (
  date: string,
  startMinutes: number,
  bookings: Booking[],
  now: Date,
) => {
  const slot = getSlot(date, startMinutes)
  return validateBooking(slot, now).length === 0 && !hasOverlap(slot, bookings)
}

export const getFirstFreeSlot = (
  date: string,
  bookings: Booking[],
  now: Date,
) => {
  const startMinutes = SLOT_STARTS.find((start) =>
    isSlotAvailable(date, start, bookings, now),
  )
  return startMinutes === undefined ? undefined : toHHmm(startMinutes)
}

export const getPastEnd = (date: string, now: Date) => {
  const today = getTodayLocal(now)
  if (date < today) return WORK_END
  if (date > today) return WORK_START

  const nextSlotStart =
    Math.ceil(getNowMinutes(now) / SLOT_MINUTES) * SLOT_MINUTES
  return Math.min(Math.max(nextSlotStart, WORK_START), WORK_END)
}
