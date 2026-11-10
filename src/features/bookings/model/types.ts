export type Booking = {
  id: string
  date: string // YYYY-MM-DD, local date
  start: string // HH:mm
  end: string // HH:mm
  title?: string
}

export type BookingDraft = Omit<Booking, 'id'>
