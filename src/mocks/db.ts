import type { Booking, BookingDraft } from '@/features/bookings/model/types'

import { createSeed } from './seed'

// Persisted so bookings survive a page reload during the demo.
const STORAGE_KEY = 'booking-mock-db'

const load = (): Booking[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed)) return parsed as Booking[]
  } catch {
    // storage unavailable or corrupted: fall back to the seed
  }
  return createSeed()
}

let bookings: Booking[] = load()

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
  } catch {
    // keep working in memory only
  }
}

export const db = {
  all: (): Booking[] => bookings,

  listByDate: (date: string): Booking[] =>
    bookings
      .filter((booking) => booking.date === date)
      .sort((a, b) => a.start.localeCompare(b.start)),

  find: (id: string): Booking | undefined =>
    bookings.find((booking) => booking.id === id),

  insert: (draft: BookingDraft): Booking => {
    const booking: Booking = { id: crypto.randomUUID(), ...draft }
    bookings = [...bookings, booking]
    persist()
    return booking
  },

  update: (id: string, draft: BookingDraft): Booking | undefined => {
    const current = db.find(id)
    if (!current) return undefined
    const updated: Booking = { id, ...draft }
    bookings = bookings.map((booking) =>
      booking.id === id ? updated : booking,
    )
    persist()
    return updated
  },

  remove: (id: string): boolean => {
    const before = bookings.length
    bookings = bookings.filter((booking) => booking.id !== id)
    persist()
    return bookings.length < before
  },

  reset: (next: Booking[] = createSeed()) => {
    bookings = next
    persist()
  },
}
