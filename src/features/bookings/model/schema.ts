import { z } from 'zod'

import { getConflictMessage, getIssueMessage } from './messages'
import { findConflict, validateBooking } from './rules'
import type { Booking } from './types'

interface IProps {
  date: string
  bookings: Booking[]
  excludeId?: string
}

export const getBookingFormSchema = ({ date, bookings, excludeId }: IProps) =>
  z
    .object({
      start: z.string(),
      end: z.string(),
      title: z.string().max(100, 'Не более 100 символов'),
    })
    .superRefine(({ start, end, title }, ctx) => {
      const draft = { date, start, end, title }
      const issues = validateBooking(draft)

      for (const issue of issues) {
        ctx.addIssue({
          code: 'custom',
          path: [issue.field === 'date' ? 'start' : issue.field],
          message: getIssueMessage(issue.code),
        })
      }
      if (issues.length > 0) return

      const conflict = findConflict(draft, bookings, excludeId)
      if (conflict) {
        ctx.addIssue({
          code: 'custom',
          path: ['start'],
          message: getConflictMessage(conflict),
        })
      }
    })

export type BookingFormValues = z.infer<ReturnType<typeof getBookingFormSchema>>
