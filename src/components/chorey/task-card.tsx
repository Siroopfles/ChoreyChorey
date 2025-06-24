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

const statusConfig = {
    'Te Doen': { color: 'border-l-[hsl(var(--status-todo))]' },
    'In Uitvoering': { color: 'border-l-[hsl(var(--status-inprogress))]' },
    Voltooid: { icon: <CheckCircle2 className="h-5 w-5 text-[hsl(var(--status-completed))]" />, color: 'border-l-[hsl(var(--status-completed))]' },
    Gearchiveerd: { icon: <Archive className="h-5 w-5 text-muted-foreground" />, color: 'border-l-[hsl(var(--status-archived))]' },
    Geannuleerd: { icon: <XCircle className="h-5 w-5 text-destructive" />, color: 'border-l-[hsl(var(--status-cancelled))]' },
};


const TaskCard = ({ task, users }: TaskCardProps) => {
  const assignee = users.find((user) => user.id === task.assigneeId);
  const PriorityIcon = priorityConfig[task.priority].icon;
  const statusInfo = statusConfig[task.status];


  return (
    <Card className={cn('hover:shadow-md transition-shadow duration-200 bg-card border-l-4', statusInfo.color)}>
      <CardHeader className="p-3 pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm font-semibold font-body leading-snug">{task.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Bewerken
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Verwijderen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && (
          <CardDescription className="text-xs line-clamp-2 mt-1">{task.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <div className="flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <Badge key={label} variant="secondary" className="font-normal text-xs">
              {label}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {assignee ? (
            <Avatar className="h-5 w-5">
              <AvatarImage src={assignee.avatar} alt={assignee.name} />
              <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ) : (
            <UserIcon className="h-5 w-5 text-gray-400" />
          )}
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>{format(task.dueDate, 'd MMM')}</span>
          </div>
          <div className={cn('flex items-center gap-1', priorityConfig[task.priority].color)}>
            <PriorityIcon className="h-3 w-3" />
            <span>{task.priority}</span>
          </div>
          {task.isPrivate && <Lock className="h-3 w-3" />}
        </div>
        {statusInfo.icon}
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
