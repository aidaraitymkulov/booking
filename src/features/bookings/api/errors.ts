import { ApiError } from '@/shared/api/errors'

import type { BookingIssue } from '../model/rules'
import type { Booking } from '../model/types'

import type { ApiErrorBody } from './types'

// 400: the server rejected the data itself.
export class ValidationError extends ApiError {
  readonly issues: BookingIssue[]

  constructor(message: string, issues: BookingIssue[] = [], data?: unknown) {
    super(message, 400, data)
    this.name = 'ValidationError'
    this.issues = issues
  }
}

// 409: the slot was taken in the meantime. `conflict` is the booking that took it.
export class ConflictError extends ApiError {
  readonly conflict?: Booking

  constructor(message: string, conflict?: Booking, data?: unknown) {
    super(message, 409, data)
    this.name = 'ConflictError'
    this.conflict = conflict
  }
}

const readBody = (data: unknown): Partial<ApiErrorBody> =>
  typeof data === 'object' && data !== null
    ? (data as Partial<ApiErrorBody>)
    : {}

// Turns the generic ApiError into the booking-specific one where it applies.
export const toBookingError = (error: unknown): unknown => {
  if (!(error instanceof ApiError)) return error

  const body = readBody(error.data)
  if (error.status === 409) {
    return new ConflictError(error.message, body.conflict, error.data)
  }
  if (error.status === 400) {
    return new ValidationError(error.message, body.issues, error.data)
  }
  return error
}
