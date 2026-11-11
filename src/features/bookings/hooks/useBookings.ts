import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createBooking,
  deleteBooking,
  getBookings,
  updateBooking,
} from '../api/bookingsApi'
import type { UpdateBookingDto } from '../api/types'

const bookingKeys = {
  all: ['bookings'] as const,
  byDate: (date: string) => [...bookingKeys.all, date] as const,
}

type UpdateBookingVariables = {
  id: string
  dto: UpdateBookingDto
}

const useInvalidateBookings = () => {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: bookingKeys.all })
}

export const useBookings = (date: string) =>
  useQuery({
    queryKey: bookingKeys.byDate(date),
    queryFn: ({ signal }) => getBookings(date, signal),
  })

export const useCreateBooking = () => {
  const invalidateBookings = useInvalidateBookings()

  return useMutation({
    mutationFn: createBooking,
    onSettled: invalidateBookings,
  })
}

export const useUpdateBooking = () => {
  const invalidateBookings = useInvalidateBookings()

  return useMutation({
    mutationFn: ({ id, dto }: UpdateBookingVariables) => updateBooking(id, dto),
    onSettled: invalidateBookings,
  })
}

export const useDeleteBooking = () => {
  const invalidateBookings = useInvalidateBookings()

  return useMutation({
    mutationFn: deleteBooking,
    onSettled: invalidateBookings,
  })
}
