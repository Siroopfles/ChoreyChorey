'use client';

import type { Task } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';

type CalendarViewProps = {
  tasks: Task[];
};

export default function CalendarView({ tasks }: CalendarViewProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const dueDates = tasks.map((task) => task.dueDate);

  const modifiers = {
    due: dueDates,
  };
  
  const modifiersStyles = {
    due: {
      color: 'hsl(var(--primary-foreground))',
      backgroundColor: 'hsl(var(--primary))',
    },
  };

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="w-full"
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
    />
  );
}
