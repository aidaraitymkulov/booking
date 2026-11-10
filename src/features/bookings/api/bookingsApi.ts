import { apiClient } from '@/shared/api/client'

import type { Booking } from '../model/types'

import { toBookingError } from './errors'
import type { CreateBookingDto, UpdateBookingDto } from './types'

const request = async <T>(call: () => Promise<{ data: T }>): Promise<T> => {
  try {
    const { data } = await call()
    return data
  } catch (error) {
    throw toBookingError(error)
  }
}

export const getBookings = (
  date: string,
  signal?: AbortSignal,
): Promise<Booking[]> =>
  request(() =>
    apiClient.get<Booking[]>('/bookings', { params: { date }, signal }),
  )

export const createBooking = (dto: CreateBookingDto): Promise<Booking> =>
  request(() => apiClient.post<Booking>('/bookings', dto))

export const updateBooking = (
  id: string,
  dto: UpdateBookingDto,
): Promise<Booking> =>
  request(() => apiClient.patch<Booking>(`/bookings/${id}`, dto))

export const deleteBooking = async (id: string): Promise<void> => {
  await request(() => apiClient.delete(`/bookings/${id}`))
}
