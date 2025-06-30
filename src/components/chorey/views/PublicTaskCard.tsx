
'use client';

import type { Task, User } from '@/lib/types';
import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Calendar, MessageSquare, Paperclip } from 'lucide-react';

export function PublicTaskCard({ task, users }: { task: Task; users: User[] }) {
  const assignees = useMemo(() => {
    return (task.assigneeIds || []).map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
  }, [task.assigneeIds, users]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-semibold">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2" dangerouslySetInnerHTML={{ __html: task.description.replace(/<[^>]+>/g, '') }} />
        )}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.map(label => (
              <Badge key={label} variant="secondary">{label}</Badge>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center -space-x-1">
            {assignees.map(assignee => (
              <TooltipProvider key={assignee.id}>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="h-6 w-6 border">
                      <AvatarImage src={assignee.avatar} />
                      <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>{assignee.name}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {task.comments && task.comments.length > 0 && (
              <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {task.comments.length}</span>
            )}
            {task.attachments && task.attachments.length > 0 && (
              <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" /> {task.attachments.length}</span>
            )}
            {task.dueDate && (
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(task.dueDate), 'd MMM', { locale: nl })}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
