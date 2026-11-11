import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'

import type { ApiErrorBody } from '@/features/bookings/api/types'
import {
  getConflictMessage,
  getIssueMessage,
} from '@/features/bookings/model/messages'
import {
  findConflict,
  hasOverlap,
  validateBooking,
  type BookingIssue,
} from '@/features/bookings/model/rules'
import { isValidDate } from '@/features/bookings/model/time'
import type { Booking, BookingDraft } from '@/features/bookings/model/types'

import { db } from './db'

const BOOKINGS_URL = '/api/bookings'

const LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 400

const RACE_COMPETITOR_TITLE = 'Занято другим пользователем'

const createBodySchema = z.object({
  date: z.string(),
  start: z.string(),
  end: z.string(),
  title: z.string().optional(),
})
const updateBodySchema = createBodySchema.partial()

const errorResponse = (status: number, body: ApiErrorBody) =>
  HttpResponse.json(body, { status })

const invalidBodyResponse = () =>
  errorResponse(400, {
    code: 'VALIDATION_ERROR',
    message: 'Некорректное тело запроса',
  })

const validationResponse = (issues: BookingIssue[]) =>
  errorResponse(400, {
    code: 'VALIDATION_ERROR',
    message: getIssueMessage(issues[0].code),
    issues,
  })

const conflictResponse = (conflict: Booking) =>
  errorResponse(409, {
    code: 'CONFLICT',
    message: getConflictMessage(conflict),
    conflict,
  })

const notFoundResponse = () =>
  errorResponse(404, { code: 'NOT_FOUND', message: 'Бронь не найдена' })

const normalizeTitle = (title: string | undefined) => title?.trim() || undefined

const simulateRace = (draft: BookingDraft): Booking | undefined => {
  const isEnabled =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('simulate409')

  if (!isEnabled || hasOverlap(draft, db.all())) return undefined

  return db.insert({ ...draft, title: RACE_COMPETITOR_TITLE })
}

const readJson = (request: Request) => request.json().catch(() => null)

export const handlers = [
  http.get(BOOKINGS_URL, async ({ request }) => {
    await delay(LATENCY_MS)

    const date = new URL(request.url).searchParams.get('date')
    if (!date || !isValidDate(date)) {
      return errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Укажите дату в формате YYYY-MM-DD',
        issues: [{ field: 'date', code: 'INVALID_DATE' }],
      })
    }

    return HttpResponse.json(db.listByDate(date))
  }),

  http.post(BOOKINGS_URL, async ({ request }) => {
    await delay(LATENCY_MS)

    const parsed = createBodySchema.safeParse(await readJson(request))
    if (!parsed.success) return invalidBodyResponse()

    const draft: BookingDraft = {
      ...parsed.data,
      title: normalizeTitle(parsed.data.title),
    }

    const issues = validateBooking(draft)
    if (issues.length > 0) return validationResponse(issues)

    const conflict = findConflict(draft, db.all()) ?? simulateRace(draft)
    if (conflict) return conflictResponse(conflict)

    return HttpResponse.json(db.insert(draft), { status: 201 })
  }),

  http.patch(`${BOOKINGS_URL}/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS)

    const id = String(params.id)
    const current = db.find(id)
    if (!current) return notFoundResponse()

    const parsed = updateBodySchema.safeParse(await readJson(request))
    if (!parsed.success) return invalidBodyResponse()

    const patch = parsed.data
    const draft: BookingDraft = {
      date: patch.date ?? current.date,
      start: patch.start ?? current.start,
      end: patch.end ?? current.end,
      title:
        patch.title === undefined ? current.title : normalizeTitle(patch.title),
    }

    const issues = validateBooking(draft)
    if (issues.length > 0) return validationResponse(issues)

    const conflict = findConflict(draft, db.all(), id) ?? simulateRace(draft)
    if (conflict) return conflictResponse(conflict)

    return HttpResponse.json(db.update(id, draft))
  }),

  http.delete(`${BOOKINGS_URL}/:id`, async ({ params }) => {
    await delay(LATENCY_MS)

    if (!db.remove(String(params.id))) return notFoundResponse()

    return new HttpResponse(null, { status: 204 })
  }),
]
