import axios from 'axios'

import type { ApiErrorBody } from './types'

const NETWORK_ERROR_MESSAGE =
  'Не удалось связаться с сервером. Проверьте соединение'
const UNKNOWN_ERROR_MESSAGE = 'Что-то пошло не так. Попробуйте ещё раз'

export const isConflictError = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 409

export const getErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return UNKNOWN_ERROR_MESSAGE
  if (!error.response) return NETWORK_ERROR_MESSAGE
  return error.response.data?.message ?? UNKNOWN_ERROR_MESSAGE
}
