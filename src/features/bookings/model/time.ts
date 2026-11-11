const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const MINUTES_IN_DAY = 24 * 60

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

export const isValidTime = (value: string): boolean => TIME_PATTERN.test(value)

export const toMinutes = (value: string): number => {
  const match = TIME_PATTERN.exec(value)
  if (!match) {
    throw new RangeError(`Invalid time "${value}", expected HH:mm`)
  }
  return Number(match[1]) * 60 + Number(match[2])
}

export const toHHmm = (minutes: number): string => {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes >= MINUTES_IN_DAY) {
    throw new RangeError(`Invalid minutes value ${minutes}`)
  }
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

export const isValidDate = (value: string): boolean => {
  const match = DATE_PATTERN.exec(value)
  if (!match) return false

  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ]
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export const formatLocalDate = (date: Date): string =>
  `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const parseLocalDate = (value: string): Date => {
  if (!isValidDate(value)) {
    throw new RangeError(`Invalid date "${value}", expected YYYY-MM-DD`)
  }
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const getTodayLocal = (now: Date = new Date()): string =>
  formatLocalDate(now)

export const getNowMinutes = (now: Date = new Date()): number =>
  now.getHours() * 60 + now.getMinutes()
