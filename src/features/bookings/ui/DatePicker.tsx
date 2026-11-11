import { addDays, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { formatLocalDate, getTodayLocal, parseLocalDate } from '../model/time'

interface IProps {
  value: string
  onChange: (date: string) => void
}

export const DatePicker = ({ value, onChange }: IProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const date = parseLocalDate(value)

  const shiftDay = (days: number) =>
    onChange(formatLocalDate(addDays(date, days)))

  const handleSelect = (selected: Date | undefined) => {
    if (!selected) return
    onChange(formatLocalDate(selected))
    setIsOpen(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label="Предыдущий день"
          onClick={() => shiftDay(-1)}
        >
          <ChevronLeftIcon />
        </Button>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger
            render={<Button variant="outline" className="font-normal" />}
          >
            <CalendarIcon />
            {format(date, 'd MMMM yyyy, EEEE', { locale: ru })}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              defaultMonth={date}
              onSelect={handleSelect}
              locale={ru}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="icon"
          aria-label="Следующий день"
          onClick={() => shiftDay(1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
      <Button variant="ghost" onClick={() => onChange(getTodayLocal())}>
        Сегодня
      </Button>
    </div>
  )
}
