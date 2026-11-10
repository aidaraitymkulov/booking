import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { db } from '@/mocks/db'
import { handlers } from '@/mocks/handlers'
import { ApiError } from '@/shared/api/errors'

import type { Booking } from '../model/types'

import {
  createBooking,
  deleteBooking,
  getBookings,
  updateBooking,
} from './bookingsApi'
import { ConflictError, ValidationError } from './errors'

// Far in the future so the tests do not depend on today's date.
const DATE = '2099-01-01'

const server = setupServer(...handlers)

const existing: Booking = {
  id: 'b1',
  date: DATE,
  start: '10:00',
  end: '11:00',
  title: 'Existing',
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  db.reset([])
})
afterAll(() => server.close())

describe('bookingsApi', () => {
  it('getBookings sends the date and returns the list', async () => {
    db.reset([existing])

    expect(await getBookings(DATE)).toEqual([existing])
    expect(await getBookings('2099-01-02')).toEqual([])
  })

  it('createBooking returns the created booking', async () => {
    const created = await createBooking({
      date: DATE,
      start: '12:00',
      end: '13:00',
    })

    expect(created).toMatchObject({ date: DATE, start: '12:00', end: '13:00' })
    expect(created.id).toBeTruthy()
  })

  it('updateBooking returns the updated booking', async () => {
    db.reset([existing])

    const updated = await updateBooking('b1', { end: '11:30' })

    expect(updated).toEqual({ ...existing, end: '11:30' })
  })

  it('deleteBooking resolves without a value', async () => {
    db.reset([existing])

    await expect(deleteBooking('b1')).resolves.toBeUndefined()
    expect(db.all()).toHaveLength(0)
  })
})

describe('booking error mapping', () => {
  it('409 becomes ConflictError with the conflicting booking', async () => {
    db.reset([existing])

    const error = await createBooking({
      date: DATE,
      start: '10:30',
      end: '11:30',
    }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ConflictError)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ConflictError).status).toBe(409)
    expect((error as ConflictError).conflict?.id).toBe('b1')
    expect((error as ConflictError).message).toBe(
      'Это время уже занято: 10:00–11:00',
    )
  })

  it('400 becomes ValidationError with issues', async () => {
    const error = await createBooking({
      date: DATE,
      start: '10:00',
      end: '10:10',
    }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ValidationError)
    expect((error as ValidationError).issues).toContainEqual({
      field: 'end',
      code: 'TOO_SHORT',
    })
  })

  it('404 becomes a plain ApiError with its status and code', async () => {
    const error = await updateBooking('missing', { end: '11:30' }).catch(
      (e: unknown) => e,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).not.toBeInstanceOf(ConflictError)
    expect((error as ApiError).status).toBe(404)
    expect((error as ApiError).data).toMatchObject({ code: 'NOT_FOUND' })
  })
})
