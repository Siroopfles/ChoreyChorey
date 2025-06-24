'use client';
import type { Task, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  Archive,
  ChevronDown,
  ChevronUp,
  Equal,
  Flame,
  CheckCircle2,
  MoreVertical,
  Trash2,
  Edit,
  User as UserIcon,
  Calendar as CalendarIcon,
  Lock,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskCardProps = {
  task: Task;
  users: User[];
};

const priorityConfig = {
  Urgent: { icon: Flame, color: 'text-chart-1' },
  Hoog: { icon: ChevronUp, color: 'text-chart-2' },
  Midden: { icon: Equal, color: 'text-chart-3' },
  Laag: { icon: ChevronDown, color: 'text-chart-4' },
};

const priorityBorderConfig = {
  Urgent: 'border-l-4 border-chart-1',
  Hoog: 'border-l-4 border-chart-2',
  Midden: 'border-l-4 border-chart-3',
  Laag: 'border-l-4 border-chart-4',
};

const statusIcons = {
  Voltooid: <CheckCircle2 className="h-5 w-5 text-chart-4" />,
  Gearchiveerd: <Archive className="h-5 w-5 text-muted-foreground" />,
  Geannuleerd: <XCircle className="h-5 w-5 text-destructive" />,
};

const TaskCard = ({ task, users }: TaskCardProps) => {
  const assignee = users.find((user) => user.id === task.assigneeId);
  const PriorityIcon = priorityConfig[task.priority].icon;

  return (
    <Card className={cn('hover:shadow-lg transition-shadow duration-200', priorityBorderConfig[task.priority])}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold font-body leading-snug">{task.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Bewerken
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" />
                Verwijderen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && (
          <CardDescription className="text-sm line-clamp-2">{task.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex flex-wrap gap-2">
          {task.labels.map((label) => (
            <Badge key={label} variant="secondary" className="font-normal">
              {label}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          {assignee ? (
            <Avatar className="h-6 w-6">
              <AvatarImage src={assignee.avatar} alt={assignee.name} />
              <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ) : (
            <UserIcon className="h-5 w-5 text-gray-400" />
          )}
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4" />
            <span>{format(task.dueDate, 'MMM d')}</span>
          </div>
          <div className={cn('flex items-center gap-1', priorityConfig[task.priority].color)}>
            <PriorityIcon className="h-4 w-4" />
            <span>{task.priority}</span>
          </div>
          {task.isPrivate && <Lock className="h-4 w-4" />}
        </div>
        {statusIcons[task.status as keyof typeof statusIcons]}
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
