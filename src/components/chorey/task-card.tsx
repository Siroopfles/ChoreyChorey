'use client';
import type { Task, User } from '@/lib/types';
import { ALL_STATUSES } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  Paperclip,
  Replace,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useTasks } from '@/contexts/task-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import EditTaskDialog from '@/components/chorey/edit-task-dialog';


type TaskCardProps = {
  task: Task;
  users: User[];
  isDragging?: boolean;
};

const priorityConfig = {
  Urgent: { icon: Flame, color: 'text-chart-1' },
  Hoog: { icon: ChevronUp, color: 'text-chart-2' },
  Midden: { icon: Equal, color: 'text-chart-3' },
  Laag: { icon: ChevronDown, color: 'text-chart-4' },
};

const statusConfig: Record<Task['status'], { icon?: JSX.Element; color: string }> = {
    'Te Doen': { color: 'border-l-gray-400' },
    'In Uitvoering': { color: 'border-l-blue-500' },
    Voltooid: { icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, color: 'border-l-green-500' },
    Gearchiveerd: { icon: <Archive className="h-5 w-5 text-gray-500" />, color: 'border-l-gray-500' },
    Geannuleerd: { icon: <XCircle className="h-5 w-5 text-destructive" />, color: 'border-l-destructive' },
};


const TaskCard = ({ task, users, isDragging }: TaskCardProps) => {
  const assignee = users.find((user) => user.id === task.assigneeId);
  const PriorityIcon = priorityConfig[task.priority].icon;
  const statusInfo = statusConfig[task.status];
  const { updateTask, toggleSubtaskCompletion, selectedTaskIds, toggleTaskSelection, cloneTask } = useTasks();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const isSelected = selectedTaskIds.includes(task.id);

  return (
    <div className="relative">
       <div className="absolute top-2 left-2 z-10">
            <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleTaskSelection(task.id)}
                aria-label={`Select task ${task.title}`}
                className='bg-background/80 hover:bg-background'
            />
        </div>
      <Card 
        className={cn(
            'hover:shadow-lg transition-shadow duration-200 bg-card border-l-4', 
            statusInfo.color,
            isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
            isDragging && 'opacity-50'
        )}
      >
        <CardHeader className="p-3 pb-2 pl-9">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-sm font-semibold font-body leading-snug pt-1">{task.title}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Bewerken
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => cloneTask(task.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Klonen
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                      <Replace className="mr-2 h-4 w-4" />
                      <span>Status wijzigen</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                          {ALL_STATUSES.map(status => (
                              <DropdownMenuItem key={status} onClick={() => updateTask(task.id, { status })}>
                                  {status}
                              </DropdownMenuItem>
                          ))}
                      </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => updateTask(task.id, { status: 'Geannuleerd' })}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Verwijderen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1 pl-9">
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.map((label) => (
              <Badge key={label} variant="secondary" className="font-normal text-xs">
                {label}
              </Badge>
            ))}
          </div>

          {task.attachments.length > 0 && (
            <div className="mb-2 space-y-1 pt-2 mt-2 border-t">
                 {task.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:underline mt-1"
                    >
                      <Paperclip className="h-3 w-3" />
                      <span className="truncate">{attachment.name}</span>
                    </a>
                  ))}
            </div>
          )}

          {totalSubtasks > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="subtasks" className="border-b-0">
                <AccordionTrigger className="p-0 hover:no-underline [&_svg]:h-4 [&_svg]:w-4">
                  <div className="w-full space-y-1">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Subtaken</span>
                      <span>
                        {completedSubtasks}/{totalSubtasks}
                      </span>
                    </div>
                    <Progress value={subtaskProgress} className="h-1" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-0">
                  <div className="space-y-2">
                    {task.subtasks.map(subtask => (
                      <div key={subtask.id} className="flex items-center gap-3">
                        <Checkbox
                          id={`subtask-${subtask.id}`}
                          checked={subtask.completed}
                          onCheckedChange={() => toggleSubtaskCompletion(task.id, subtask.id)}
                        />
                        <label
                          htmlFor={`subtask-${subtask.id}`}
                          className={cn("text-sm leading-none cursor-pointer", subtask.completed && "line-through text-muted-foreground")}
                        >
                          {subtask.text}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
        <CardFooter className="p-3 pt-2 flex justify-between items-center text-xs text-muted-foreground pl-9">
          <div className="flex items-center gap-3">
            {assignee ? (
              <Avatar className="h-5 w-5">
                <AvatarImage src={assignee.avatar} alt={assignee.name} data-ai-hint="person face" />
                <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-5 w-5 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-gray-400" />
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                <span>{format(task.dueDate, 'd MMM')}</span>
              </div>
            )}
            <div className={cn('flex items-center gap-1 font-medium', priorityConfig[task.priority].color)}>
              <PriorityIcon className="h-3 w-3" />
              <span>{task.priority}</span>
            </div>
            {task.attachments.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                <span>{task.attachments.length}</span>
              </div>
            )}
            {task.isPrivate && <Lock className="h-3 w-3" />}
          </div>
          {statusInfo.icon}
        </CardFooter>
      </Card>
      <EditTaskDialog 
        isOpen={isEditDialogOpen} 
        setIsOpen={setIsEditDialogOpen} 
        task={task}
        users={users} 
      />
    </div>
  );
};

export default TaskCard;
