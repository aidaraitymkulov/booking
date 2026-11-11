import { describe, expect, it } from 'vitest'

import {
  formatLocalDate,
  getNowMinutes,
  getTodayLocal,
  isValidDate,
  isValidTime,
  parseLocalDate,
  toHHmm,
  toMinutes,
} from './time'

describe('toMinutes', () => {
  it('converts HH:mm to minutes from midnight', () => {
    expect(toMinutes('00:00')).toBe(0)
    expect(toMinutes('09:00')).toBe(540)
    expect(toMinutes('10:30')).toBe(630)
    expect(toMinutes('23:59')).toBe(1439)
  })

  it.each(['24:00', '10:60', '9:00', '10:5', '', 'abc', '10-30', ' 10:30'])(
    'throws on invalid time "%s"',
    (value) => {
      expect(() => toMinutes(value)).toThrow(RangeError)
    },
  )
})

describe('toHHmm', () => {
  it('formats minutes with leading zeros', () => {
    expect(toHHmm(0)).toBe('00:00')
    expect(toHHmm(540)).toBe('09:00')
    expect(toHHmm(630)).toBe('10:30')
    expect(toHHmm(1439)).toBe('23:59')
  })

  it('is the inverse of toMinutes', () => {
    for (const value of ['00:00', '09:05', '12:30', '18:00', '23:59']) {
      expect(toHHmm(toMinutes(value))).toBe(value)
    }
  })

  it.each([-1, 1440, 10.5, Number.NaN])('throws on %s', (value) => {
    expect(() => toHHmm(value)).toThrow(RangeError)
  })
})

describe('isValidTime', () => {
  it('accepts only strict HH:mm', () => {
    expect(isValidTime('09:00')).toBe(true)
    expect(isValidTime('9:00')).toBe(false)
    expect(isValidTime('24:00')).toBe(false)
  })
})

describe('isValidDate', () => {
  it('accepts real calendar dates', () => {
    expect(isValidDate('2026-11-10')).toBe(true)
    expect(isValidDate('2028-02-29')).toBe(true)
  })

  it.each([
    '2026-02-30',
    '2027-02-29',
    '2026-13-01',
    '2026-00-10',
    '2026-1-1',
    '',
    '10.11.2026',
  ])('rejects "%s"', (value) => {
    expect(isValidDate(value)).toBe(false)
  })
})

describe('formatLocalDate / parseLocalDate', () => {
  it('formats with zero padding', () => {
    expect(formatLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('round-trips a date', () => {
    expect(formatLocalDate(parseLocalDate('2026-11-10'))).toBe('2026-11-10')
  })

  it('parses to local midnight', () => {
    const date = parseLocalDate('2026-11-10')
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([
      2026, 10, 10,
    ])
    expect([date.getHours(), date.getMinutes()]).toEqual([0, 0])
  })

  it('throws on an invalid date', () => {
    expect(() => parseLocalDate('2026-02-30')).toThrow(RangeError)
  })
})

describe('getTodayLocal', () => {
  it('uses the local date, not UTC, right after midnight', () => {
    expect(getTodayLocal(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01')
  })

  it('uses the local date late in the evening', () => {
    expect(getTodayLocal(new Date(2026, 0, 1, 23, 30))).toBe('2026-01-01')
  })
})

describe('getNowMinutes', () => {
  it('returns minutes from local midnight', () => {
    expect(getNowMinutes(new Date(2026, 10, 10, 0, 0))).toBe(0)
    expect(getNowMinutes(new Date(2026, 10, 10, 14, 45))).toBe(885)
  })
})
