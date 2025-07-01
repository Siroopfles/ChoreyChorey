

'use client';

import type { Task, User, Priority } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { useState, useEffect } from 'react';
import { isSameDay, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/utils';
import { useTasks } from '@/contexts/task-context';
import { useIsMobile } from '@/hooks/use-mobile';

type CalendarViewProps = {
  tasks: Task[];
  users: User[];
};

const priorityBorderColor: Record<Priority, string> = {
  'Urgent': 'border-chart-1',
  'Hoog': 'border-chart-2',
  'Midden': 'border-chart-3',
  'Laag': 'border-chart-4',
};

export default function CalendarView({ tasks, users }: CalendarViewProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const { navigateToUserProfile } = useTasks();
  const isMobile = useIsMobile();

  // Set initial date on the client-side to avoid hydration mismatch
  useEffect(() => {
    setDate(new Date());
  }, []);

  const dueDates = tasks.map((task) => task.dueDate).filter((d): d is Date => !!d);

  useEffect(() => {
    if (date) {
      const tasksForDay = tasks.filter(task => task.dueDate && isSameDay(task.dueDate, date));
      setSelectedTasks(tasksForDay);
    } else {
      setSelectedTasks([]);
    }
  }, [date, tasks]);

  const handleSelectDate = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
  }

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
    <div className={cn("p-4", isMobile ? 'flex flex-col gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-6')}>
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleSelectDate}
        className="w-full"
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
      />
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>
            {date ? `Taken voor ${format(date, 'd MMMM yyyy', { locale: nl })}` : 'Selecteer een dag'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedTasks.length > 0 ? (
            <ul className="space-y-3">
              {selectedTasks.map(task => {
                const assignee = users.find(u => u.id === task.assigneeIds[0]);
                return (
                  <li key={task.id} className={cn("flex items-center justify-between p-3 rounded-lg border bg-background border-l-4", priorityBorderColor[task.priority])}>
                    <div className="flex-1">
                      <p className="font-semibold">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.priority}</p>
                    </div>
                    {assignee && (
                      <button
                        type="button"
                        className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onClick={() => navigateToUserProfile(assignee.id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={assignee.avatar} alt={assignee.name} />
                          <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="flex items-center justify-center text-center text-muted-foreground h-full min-h-[200px]">
              <p>{date ? 'Geen taken voor deze dag.' : 'Laden...'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
