import { useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useBookings } from '../hooks/useBookings'
import { RULES_HINT } from '../model/messages'
import { getTodayLocal } from '../model/time'
import { getFirstFreeSlot } from '../model/timeline'
import type { Booking } from '../model/types'

import { BookingFormDialog } from './BookingFormDialog'
import { BookingTimeline } from './BookingTimeline'
import { DatePicker } from './DatePicker'

export const BookingPage = () => {
  const [date, setDate] = useState(getTodayLocal)
  const [formTarget, setFormTarget] = useState<Partial<Booking> | null>(null)
  const {
    data: bookings,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useBookings(date)

  const isPastDate = date < getTodayLocal()
  const firstFreeSlot = bookings
    ? getFirstFreeSlot(date, bookings, new Date())
    : undefined

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
      <h1 className="text-xl font-semibold">Бронирование переговорной</h1>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <DatePicker value={date} onChange={setDate} />
        <Button
          disabled={!firstFreeSlot}
          onClick={() => setFormTarget({ start: firstFreeSlot })}
        >
          Забронировать
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{RULES_HINT}</p>

      {isPastDate && (
        <Alert>
          <AlertDescription>
            Прошедшая дата: бронирование недоступно.
          </AlertDescription>
        </Alert>
      )}

      {isPending && (
        <div
          role="status"
          aria-label="Загрузка броней"
          className="space-y-3 py-3"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Alert
          variant="destructive"
          className="flex flex-col items-start gap-3"
        >
          <div>
            <AlertTitle>Не удалось загрузить брони</AlertTitle>
            <AlertDescription>
              Проверьте соединение и попробуйте ещё раз.
            </AlertDescription>
          </div>
          <Button
            variant="outline"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {isFetching ? 'Загрузка…' : 'Повторить'}
          </Button>
        </Alert>
      )}

      {bookings && (
        <>
          {bookings.length === 0 && (
            <p className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
              На этот день броней нет. Выберите свободный слот, чтобы
              забронировать.
            </p>
          )}
          <BookingTimeline
            date={date}
            bookings={bookings}
            onSlotSelect={(start) => setFormTarget({ start })}
            onBookingSelect={setFormTarget}
          />
          {formTarget && (
            <BookingFormDialog
              date={date}
              bookings={bookings}
              target={formTarget}
              onClose={() => setFormTarget(null)}
            />
          )}
        </>
      )}
    </main>
  )
}
