import axios from 'axios'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { apiClient } from './client'
import { ApiError } from './errors'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const failure = (path = '/ping', signal?: AbortSignal) =>
  apiClient.get(path, { signal }).catch((error: unknown) => error)

describe('apiClient', () => {
  it('resolves a successful response untouched', async () => {
    server.use(http.get('/api/ping', () => HttpResponse.json({ ok: true })))

    const response = await apiClient.get('/ping')

    expect(response.data).toEqual({ ok: true })
  })

  it('maps an error response to ApiError with status, message and data', async () => {
    server.use(
      http.get('/api/ping', () =>
        HttpResponse.json(
          { code: 'BOOM', message: 'Сломалось' },
          { status: 500 },
        ),
      ),
    )

    const error = await failure()

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(500)
    expect((error as ApiError).message).toBe('Сломалось')
    expect((error as ApiError).data).toEqual({
      code: 'BOOM',
      message: 'Сломалось',
    })
  })

  it('falls back to a generic message when the body has none', async () => {
    server.use(
      http.get('/api/ping', () =>
        HttpResponse.text('<html>Bad gateway</html>', { status: 502 }),
      ),
    )

    const error = await failure()

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(502)
    expect((error as ApiError).message).toBe(
      'Что-то пошло не так. Попробуйте ещё раз',
    )
  })

  it('maps a network failure to ApiError with status 0', async () => {
    server.use(http.get('/api/ping', () => HttpResponse.error()))

    const error = await failure()

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(0)
  })

  it('keeps an aborted request a cancellation, not an ApiError', async () => {
    const controller = new AbortController()
    controller.abort()

    const error = await failure('/ping', controller.signal)

    expect(axios.isCancel(error)).toBe(true)
    expect(error).not.toBeInstanceOf(ApiError)
  })
})
