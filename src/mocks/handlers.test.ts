import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { ApiErrorBody } from '@/features/bookings/api/types'
import type { Booking } from '@/features/bookings/model/types'

import { db } from './db'
import { handlers } from './handlers'

const DATE = '2099-01-01'
const OTHER_DATE = '2099-01-02'

const server = setupServer(...handlers)

const api = (path: string, init?: RequestInit) =>
  fetch(new URL(`/api/bookings${path}`, window.location.origin), init)

const send = (method: string, path: string, body?: unknown) =>
  api(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

const seedBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'b1',
  date: DATE,
  start: '10:00',
  end: '11:00',
  title: 'Existing',
  ...overrides,
})

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  db.reset([])
  window.history.replaceState({}, '', '/')
})
afterAll(() => server.close())

describe('GET /api/bookings', () => {
  it('returns bookings of the date sorted by start', async () => {
    db.reset([
      seedBooking({ id: 'late', start: '15:00', end: '16:00' }),
      seedBooking({ id: 'early', start: '09:00', end: '10:00' }),
      seedBooking({ id: 'other', date: OTHER_DATE }),
    ])

    const response = await api(`?date=${DATE}`)
    const body = (await response.json()) as Booking[]

    expect(response.status).toBe(200)
    expect(body.map((booking) => booking.id)).toEqual(['early', 'late'])
  })

  it('returns an empty list for a free date', async () => {
    const response = await api(`?date=${DATE}`)
    expect(await response.json()).toEqual([])
  })

  it.each(['', '?date=', '?date=2099-02-30', '?date=tomorrow'])(
    'responds 400 for a missing or invalid date (%s)',
    async (query) => {
      const response = await api(query)
      const body = (await response.json()) as ApiErrorBody

      expect(response.status).toBe(400)
      expect(body.code).toBe('VALIDATION_ERROR')
    },
  )
})

describe('POST /api/bookings', () => {
  it('creates a booking', async () => {
    const response = await send('POST', '', {
      date: DATE,
      start: '10:00',
      end: '11:00',
      title: '  Sync  ',
    })
    const body = (await response.json()) as Booking

    expect(response.status).toBe(201)
    expect(body).toMatchObject({
      date: DATE,
      start: '10:00',
      end: '11:00',
      title: 'Sync',
    })
    expect(body.id).toBeTruthy()
    expect(db.listByDate(DATE)).toHaveLength(1)
  })

  it('allows a booking that only touches an existing one', async () => {
    db.reset([seedBooking()])

    const response = await send('POST', '', {
      date: DATE,
      start: '11:00',
      end: '12:00',
    })

    expect(response.status).toBe(201)
  })

  it('responds 400 with issues for invalid data', async () => {
    const response = await send('POST', '', {
      date: DATE,
      start: '08:00',
      end: '08:10',
    })
    const body = (await response.json()) as ApiErrorBody

    expect(response.status).toBe(400)
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.issues).toEqual(
      expect.arrayContaining([
        { field: 'start', code: 'OUTSIDE_WORKING_HOURS' },
        { field: 'end', code: 'OUTSIDE_WORKING_HOURS' },
        { field: 'end', code: 'TOO_SHORT' },
      ]),
    )
    expect(db.all()).toHaveLength(0)
  })

  it('responds 400 for a past date', async () => {
    const response = await send('POST', '', {
      date: '2000-01-01',
      start: '10:00',
      end: '11:00',
    })
    const body = (await response.json()) as ApiErrorBody

    expect(response.status).toBe(400)
    expect(body.issues).toContainEqual({ field: 'date', code: 'PAST_DATE' })
  })

  it.each([{}, { date: DATE }, { date: DATE, start: 10, end: '11:00' }])(
    'responds 400 for a malformed body (%j)',
    async (payload) => {
      const response = await send('POST', '', payload)
      expect(response.status).toBe(400)
    },
  )

  it('responds 400 for a body that is not JSON', async () => {
    const response = await api('', { method: 'POST', body: 'not json' })
    expect(response.status).toBe(400)
  })

  it('responds 409 with the conflicting booking on overlap', async () => {
    db.reset([seedBooking()])

    const response = await send('POST', '', {
      date: DATE,
      start: '10:30',
      end: '11:30',
    })
    const body = (await response.json()) as ApiErrorBody

    expect(response.status).toBe(409)
    expect(body.code).toBe('CONFLICT')
    expect(body.conflict?.id).toBe('b1')
    expect(db.all()).toHaveLength(1)
  })

  it('does not conflict with a booking on another date', async () => {
    db.reset([seedBooking({ date: OTHER_DATE })])

    const response = await send('POST', '', {
      date: DATE,
      start: '10:00',
      end: '11:00',
    })

    expect(response.status).toBe(201)
  })
})

describe('PATCH /api/bookings/:id', () => {
  it('updates only the sent fields', async () => {
    db.reset([seedBooking()])

    const response = await send('PATCH', '/b1', { end: '11:30' })
    const body = (await response.json()) as Booking

    expect(response.status).toBe(200)
    expect(body).toEqual({
      id: 'b1',
      date: DATE,
      start: '10:00',
      end: '11:30',
      title: 'Existing',
    })
  })

  it('does not conflict with itself', async () => {
    db.reset([seedBooking()])

    const response = await send('PATCH', '/b1', {
      start: '10:00',
      end: '11:30',
    })

    expect(response.status).toBe(200)
  })

  it('clears the title when it is empty', async () => {
    db.reset([seedBooking()])

    const response = await send('PATCH', '/b1', { title: '' })
    const body = (await response.json()) as Booking

    expect(body.title).toBeUndefined()
  })

  it('responds 409 when moving onto another booking', async () => {
    db.reset([
      seedBooking(),
      seedBooking({ id: 'b2', start: '12:00', end: '13:00' }),
    ])

    const response = await send('PATCH', '/b1', {
      start: '11:30',
      end: '12:30',
    })
    const body = (await response.json()) as ApiErrorBody

    expect(response.status).toBe(409)
    expect(body.conflict?.id).toBe('b2')
    expect(db.find('b1')?.start).toBe('10:00')
  })

  it('validates the merged result (400)', async () => {
    db.reset([seedBooking()])

    const response = await send('PATCH', '/b1', { end: '09:30' })
    const body = (await response.json()) as ApiErrorBody

    expect(response.status).toBe(400)
    expect(body.issues).toContainEqual({
      field: 'end',
      code: 'END_NOT_AFTER_START',
    })
  })

  it('responds 404 for an unknown id', async () => {
    const response = await send('PATCH', '/missing', { end: '11:30' })
    const body = (await response.json()) as ApiErrorBody

    expect(response.status).toBe(404)
    expect(body.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/bookings/:id', () => {
  it('deletes a booking', async () => {
    db.reset([seedBooking()])

    const response = await send('DELETE', '/b1')

    expect(response.status).toBe(204)
    expect(db.all()).toHaveLength(0)
  })

  it('responds 404 for an unknown id', async () => {
    const response = await send('DELETE', '/missing')
    expect(response.status).toBe(404)
  })
})

describe('?simulate409', () => {
  it('rejects a free slot with 409 and stores the competing booking', async () => {
    window.history.replaceState({}, '', '/?simulate409')

    const response = await send('POST', '', {
      date: DATE,
      start: '10:00',
      end: '11:00',
    })
    const body = (await response.json()) as ApiErrorBody

    expect(response.status).toBe(409)
    expect(body.conflict).toMatchObject({
      date: DATE,
      start: '10:00',
      end: '11:00',
    })
    expect(db.listByDate(DATE)).toHaveLength(1)
  })

  it('also applies to PATCH', async () => {
    db.reset([seedBooking()])
    window.history.replaceState({}, '', '/?simulate409')

    const response = await send('PATCH', '/b1', {
      start: '14:00',
      end: '15:00',
    })

    expect(response.status).toBe(409)
    expect(db.find('b1')?.start).toBe('10:00')
    expect(db.listByDate(DATE)).toHaveLength(2)
  })

  it('is off by default', async () => {
    const response = await send('POST', '', {
      date: DATE,
      start: '10:00',
      end: '11:00',
    })
    expect(response.status).toBe(201)
  })
})
