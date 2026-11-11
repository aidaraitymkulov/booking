import { useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { getErrorMessage } from '../api/errors'
import { useDeleteBooking } from '../hooks/useBookings'
import type { Booking } from '../model/types'

interface IProps {
  booking: Booking
  disabled: boolean
  onDeleted: () => void
}

export const DeleteBookingButton = ({
  booking,
  disabled,
  onDeleted,
}: IProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const deleteBooking = useDeleteBooking()

  const handleDelete = async () => {
    try {
      await deleteBooking.mutateAsync(booking.id)
      toast.success('Бронь удалена')
      onDeleted()
    } catch (error) {
      setIsOpen(false)
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger
        render={
          <Button type="button" variant="destructive" disabled={disabled} />
        }
      >
        Удалить
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить бронь?</AlertDialogTitle>
          <AlertDialogDescription>
            {booking.start}–{booking.end}
            {booking.title && `, ${booking.title}`}. Это действие нельзя
            отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteBooking.isPending}
            onClick={handleDelete}
          >
            {deleteBooking.isPending ? 'Удаление…' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
