import type { BookingIssue } from '../model/rules'
import type { Booking, BookingDraft } from '../model/types'

export type CreateBookingDto = BookingDraft

// PATCH sends only the changed fields; an empty title clears it.
export type UpdateBookingDto = Partial<BookingDraft>

export type ApiErrorCode = 'VALIDATION_ERROR' | 'CONFLICT' | 'NOT_FOUND'

// Body of every non-2xx response.
export type ApiErrorBody = {
  code: ApiErrorCode
  message: string
  issues?: BookingIssue[] // 400
  conflict?: Booking // 409
}
