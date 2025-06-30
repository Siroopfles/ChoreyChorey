
'use client';

import type { Task, User, StatusDefinition } from '@/lib/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { PublicTaskCard } from './PublicTaskCard';

interface PublicDashboardViewProps {
    tasks: Task[];
    users: User[];
    statuses: StatusDefinition[];
}

export default function PublicDashboardView({ tasks, users, statuses }: PublicDashboardViewProps) {
    const groupedTasks = statuses.map(status => ({
        title: status.name,
        tasks: tasks.filter(task => task.status === status.name).sort((a,b) => a.order - b.order)
    }));
    
    return (
        <ScrollArea className="w-full h-full">
            <div className="flex gap-6 pb-4 h-full">
                {groupedTasks.map((group) => (
                    <div key={group.title} className="flex flex-col w-[320px] shrink-0 h-full">
                        <div className="flex items-center gap-2 px-1 pb-2">
                            <h2 className="text-base font-semibold text-foreground">{group.title}</h2>
                            <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                                {group.tasks.length}
                            </span>
                        </div>
                        <div className="flex-grow space-y-3 p-2 overflow-y-auto rounded-md bg-background/50 min-h-[200px]">
                            {group.tasks.map((task) => (
                                <PublicTaskCard key={task.id} task={task} users={users} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}
