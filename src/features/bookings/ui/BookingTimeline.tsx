import { PlusIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { SLOT_MINUTES, WORK_START } from '../model/constants'
import { validateBooking } from '../model/rules'
import { toHHmm, toMinutes } from '../model/time'
import {
  HOUR_MARKS,
  SLOT_STARTS,
  TIMELINE_HEIGHT,
  getHeight,
  getPastEnd,
  getSlot,
  getTop,
  isSlotAvailable,
} from '../model/timeline'
import type { Booking } from '../model/types'

interface IProps {
  date: string
  bookings: Booking[]
  onSlotSelect: (start: string) => void
  onBookingSelect: (booking: Booking) => void
}

export const BookingTimeline = ({
  date,
  bookings,
  onSlotSelect,
  onBookingSelect,
}: IProps) => {
  const now = new Date()
  const pastEnd = getPastEnd(date, now)

  return (
    <div className="py-3">
      <div
        role="group"
        aria-label="Расписание"
        className="relative"
        style={{ height: TIMELINE_HEIGHT }}
      >
        {HOUR_MARKS.map((minutes) => (
          <div
            key={minutes}
            className="absolute inset-x-0 flex -translate-y-1/2 items-center gap-2"
            style={{ top: getTop(minutes) }}
          >
            <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
              {toHHmm(minutes)}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        ))}

        <div className="absolute inset-y-0 right-0 left-14">
          {pastEnd > WORK_START && (
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 rounded-md bg-muted/40 bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--border)_6px_7px)]"
              style={{ height: getHeight(pastEnd - WORK_START) }}
            />
          )}

          {SLOT_STARTS.map((startMinutes) => {
            if (!isSlotAvailable(date, startMinutes, bookings, now)) return null

            const slot = getSlot(date, startMinutes)

            return (
              <button
                key={slot.start}
                type="button"
                aria-label={`Свободно ${slot.start}–${slot.end}, забронировать`}
                onClick={() => onSlotSelect(slot.start)}
                className="group absolute inset-x-0 flex items-center gap-2 rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-accent-foreground focus-visible:border-primary/40 focus-visible:bg-accent"
                style={{
                  top: getTop(startMinutes) + 1,
                  height: getHeight(SLOT_MINUTES) - 2,
                }}
              >
                <PlusIcon className="size-4" />
                <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
                  Забронировать {slot.start}
                </span>
              </button>
            )
          })}

          {bookings.map((booking) => {
            const start = toMinutes(booking.start)
            const end = toMinutes(booking.end)
            const style = {
              top: getTop(start),
              height: getHeight(end - start),
            }
            const isPast = validateBooking(booking, now).length > 0
            const className = cn(
              'absolute inset-x-0 z-10 flex items-start gap-2 overflow-hidden rounded-md border px-3 py-1 text-left text-sm',
              isPast
                ? 'border-border bg-muted text-muted-foreground'
                : 'border-booked-border bg-booked text-booked-foreground',
            )
            const content = (
              <>
                <span className="font-medium tabular-nums">
                  {booking.start}–{booking.end}
                </span>
                {booking.title && (
                  <span className="truncate">{booking.title}</span>
                )}
              </>
            )

            if (isPast) {
              return (
                <div key={booking.id} className={className} style={style}>
                  {content}
                </div>
              )
            }

            return (
              <button
                key={booking.id}
                type="button"
                aria-label={`Занято ${booking.start}–${booking.end}${booking.title ? `, ${booking.title}` : ''}. Редактировать`}
                onClick={() => onBookingSelect(booking)}
                className={cn(className, 'hover:brightness-95')}
                style={style}
              >
                {content}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
