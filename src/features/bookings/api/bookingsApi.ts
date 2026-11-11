import { apiClient } from '@/shared/api/api'

import type { Booking } from '../model/types'

import type { CreateBookingDto, UpdateBookingDto } from './types'

export const getBookings = async (date: string, signal?: AbortSignal) => {
  const { data } = await apiClient.get<Booking[]>('/bookings', {
    params: { date },
    signal,
  })
  return data
}

export const createBooking = async (dto: CreateBookingDto) => {
  const { data } = await apiClient.post<Booking>('/bookings', dto)
  return data
}

export const updateBooking = async (id: string, dto: UpdateBookingDto) => {
  const { data } = await apiClient.patch<Booking>(`/bookings/${id}`, dto)
  return data
}

export const deleteBooking = async (id: string) => {
  await apiClient.delete(`/bookings/${id}`)
}
