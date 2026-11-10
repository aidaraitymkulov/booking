import { formatLocalDate } from '@/features/bookings/model/time'
import type { Booking } from '@/features/bookings/model/types'

// Dates are relative to "now": past dates cannot be booked, so a fixed seed
// would look empty on the demo a day later.
export const createSeed = (now: Date = new Date()): Booking[] => {
  const today = formatLocalDate(now)
  const tomorrow = formatLocalDate(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
  )

  return [
    {
      id: 'seed-1',
      date: today,
      start: '09:00',
      end: '10:00',
      title: 'Планёрка команды',
    },
    {
      id: 'seed-2',
      date: today,
      start: '13:00',
      end: '14:30',
      title: 'Интервью с кандидатом',
    },
    {
      id: 'seed-3',
      date: tomorrow,
      start: '10:00',
      end: '11:30',
      title: 'Демо для клиента',
    },
    {
      id: 'seed-4',
      date: tomorrow,
      start: '15:00',
      end: '16:00',
      title: 'Ретроспектива',
    },
  ]
}
