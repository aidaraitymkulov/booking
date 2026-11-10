import { MAX_DURATION, MIN_DURATION, WORK_END, WORK_START } from './constants'
import type { BookingIssueCode } from './rules'
import { toHHmm } from './time'
import type { Booking } from './types'

const formatDuration = (minutes: number): string =>
  minutes % 60 === 0 ? `${minutes / 60} ч` : `${minutes} мин`

const ISSUE_MESSAGES: Record<BookingIssueCode, string> = {
  INVALID_DATE: 'Укажите корректную дату',
  INVALID_TIME: 'Укажите время в формате ЧЧ:ММ',
  OUTSIDE_WORKING_HOURS: `Время должно быть в пределах ${toHHmm(WORK_START)}–${toHHmm(WORK_END)}`,
  END_NOT_AFTER_START: 'Время окончания должно быть позже времени начала',
  TOO_SHORT: `Минимальная длительность — ${formatDuration(MIN_DURATION)}`,
  TOO_LONG: `Максимальная длительность — ${formatDuration(MAX_DURATION)}`,
  PAST_DATE: 'Нельзя бронировать на прошедшую дату',
  PAST_TIME: 'Это время уже прошло',
}

export const getIssueMessage = (code: BookingIssueCode): string =>
  ISSUE_MESSAGES[code]

export const getConflictMessage = (conflict: Booking): string =>
  `Это время уже занято: ${conflict.start}–${conflict.end}`
