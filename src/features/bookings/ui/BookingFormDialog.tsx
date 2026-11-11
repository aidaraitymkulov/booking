import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { getErrorMessage, isConflictError } from '../api/errors'
import { useCreateBooking, useUpdateBooking } from '../hooks/useBookings'
import { getDefaultEnd } from '../model/rules'
import { getBookingFormSchema, type BookingFormValues } from '../model/schema'
import { parseLocalDate } from '../model/time'
import type { Booking } from '../model/types'

import { DeleteBookingButton } from './DeleteBookingButton'

interface IProps {
  date: string
  bookings: Booking[]
  target: Partial<Booking>
  onClose: () => void
}

export const BookingFormDialog = ({
  date,
  bookings,
  target,
  onClose,
}: IProps) => {
  const createBooking = useCreateBooking()
  const updateBooking = useUpdateBooking()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(
      getBookingFormSchema({ date, bookings, excludeId: target.id }),
    ),
    defaultValues: {
      start: target.start ?? '',
      end: target.end ?? (target.start ? getDefaultEnd(target.start) : ''),
      title: target.title ?? '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (target.id) {
        await updateBooking.mutateAsync({ id: target.id, dto: values })
      } else {
        await createBooking.mutateAsync({ date, ...values })
      }
      toast.success(target.id ? 'Бронь обновлена' : 'Бронь создана')
      onClose()
    } catch (error) {
      const message = getErrorMessage(error)
      setError('root.server', {
        message: isConflictError(error)
          ? `${message}. Расписание обновлено, выберите другое время.`
          : message,
      })
    }
  })

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {target.id ? 'Редактирование брони' : 'Новая бронь'}
          </DialogTitle>
          <DialogDescription>
            {format(parseLocalDate(date), 'd MMMM yyyy, EEEE', { locale: ru })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {errors.root?.server && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.server.message}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.start}>
                <FieldLabel htmlFor="start">Начало</FieldLabel>
                <Input
                  id="start"
                  inputMode="numeric"
                  placeholder="09:00"
                  maxLength={5}
                  autoComplete="off"
                  aria-invalid={!!errors.start}
                  {...register('start')}
                />
                <FieldError errors={[errors.start]} />
              </Field>
              <Field data-invalid={!!errors.end}>
                <FieldLabel htmlFor="end">Конец</FieldLabel>
                <Input
                  id="end"
                  inputMode="numeric"
                  placeholder="10:00"
                  maxLength={5}
                  autoComplete="off"
                  aria-invalid={!!errors.end}
                  {...register('end')}
                />
                <FieldError errors={[errors.end]} />
              </Field>
            </div>
            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor="title">Название (необязательно)</FieldLabel>
              <Input
                id="title"
                aria-invalid={!!errors.title}
                {...register('title')}
              />
              <FieldError errors={[errors.title]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            {target.id && (
              <DeleteBookingButton
                booking={target as Booking}
                disabled={isSubmitting}
                onDeleted={onClose}
              />
            )}
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
