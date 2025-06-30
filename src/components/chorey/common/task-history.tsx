
'use client';

import type { User, HistoryEntry } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const HistoryItem = ({ entry, user }: { entry: HistoryEntry; user?: User }) => {
  return (
    <li className="flex items-start gap-3">
      <Avatar className="h-8 w-8 border">
        <AvatarImage src={user?.avatar} />
        <AvatarFallback>{user?.name.charAt(0) ?? '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm">
            <span className="font-semibold">{user?.name ?? 'Systeem'}</span>
            <span> {entry.action.toLowerCase()} </span>
            {entry.details && <span className="text-muted-foreground">({entry.details})</span>}
        </p>
         <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(entry.timestamp, { addSuffix: true, locale: nl })}
        </p>
      </div>
    </li>
  );
}

type TaskHistoryProps = {
  task: { history?: HistoryEntry[] };
  users: User[];
};

export function TaskHistory({ task, users }: TaskHistoryProps) {
  const sortedHistory = [...(task.history || [])].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <ScrollArea className="h-full pr-2">
        <ul className="space-y-4">
            {sortedHistory.length > 0 ? (
                sortedHistory.map(entry => (
                    <HistoryItem key={entry.id} entry={entry} user={users.find(u => u.id === entry.userId)} />
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Geen geschiedenis.</p>
            )}
        </ul>
    </ScrollArea>
  );
}
