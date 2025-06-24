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
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  CheckCircle2,
  MoreVertical,
  Trash2,
  Edit,
  User as UserIcon,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskCardProps = {
  task: Task;
  users: User[];
};

const priorityIcons = {
  Hoog: <ArrowUp className="h-4 w-4 text-red-500" />,
  Midden: <ArrowRight className="h-4 w-4 text-yellow-500" />,
  Laag: <ArrowRight className="h-4 w-4 text-green-500" />,
};

const priorityColors = {
  Hoog: 'border-l-4 border-red-500',
  Midden: 'border-l-4 border-yellow-500',
  Laag: 'border-l-4 border-green-500',
};

const TaskCard = ({ task, users }: TaskCardProps) => {
  const assignee = users.find((user) => user.id === task.assigneeId);

  return (
    <Card className={cn('hover:shadow-md transition-shadow duration-200', priorityColors[task.priority])}>
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
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Verwijderen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="text-sm line-clamp-2">{task.description}</CardDescription>
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
          <div className="flex items-center gap-1">
            {priorityIcons[task.priority]}
            <span>{task.priority}</span>
          </div>
        </div>
        {task.status === 'Done' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
