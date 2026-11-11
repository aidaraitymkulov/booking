import type { BookingIssue } from '../model/rules'
import type { Booking, BookingDraft } from '../model/types'

export type CreateBookingDto = BookingDraft

export type UpdateBookingDto = Partial<BookingDraft>

export type ApiErrorCode = 'VALIDATION_ERROR' | 'CONFLICT' | 'NOT_FOUND'

export type ApiErrorBody = {
  code: ApiErrorCode
  message: string
  issues?: BookingIssue[]
  conflict?: Booking
}
