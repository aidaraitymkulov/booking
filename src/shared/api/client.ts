import axios from 'axios'

import { ApiError } from './errors'

const NETWORK_ERROR_MESSAGE =
  'Не удалось связаться с сервером. Проверьте соединение'
const UNKNOWN_ERROR_MESSAGE = 'Что-то пошло не так. Попробуйте ещё раз'

// The body is not guaranteed to carry a message (proxy error pages, 500s).
const readMessage = (data: unknown): string | undefined => {
  if (typeof data !== 'object' || data === null) return undefined
  const { message } = data as { message?: unknown }
  return typeof message === 'string' ? message : undefined
}

const toApiError = (error: unknown): unknown => {
  // Aborted requests (TanStack Query cancels them) are not failures: pass through.
  if (axios.isCancel(error) || !axios.isAxiosError(error)) return error

  if (!error.response) return new ApiError(NETWORK_ERROR_MESSAGE, 0)

  const { status, data } = error.response
  return new ApiError(readMessage(data) ?? UNKNOWN_ERROR_MESSAGE, status, data)
}

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
)
