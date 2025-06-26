
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import type { User, Status, Task } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const STATUS_PRIORITY: Record<Status, number> = {
    'In Uitvoering': 1,
    'In Review': 2,
    'Te Doen': 3,
    'Voltooid': 4,
    'Geannuleerd': 5,
    'Gearchiveerd': 5,
};

const getUserDominantStatus = (tasks: Task[], userId: string): Status | 'Idle' => {
    const userTasks = tasks.filter(task => task.assigneeIds.includes(userId));
    if (userTasks.length === 0) return 'Idle';

    return userTasks.reduce((currentDominant: Status | 'Idle', task) => {
        if (currentDominant === 'Idle' || STATUS_PRIORITY[task.status] < STATUS_PRIORITY[currentDominant]) {
            return task.status;
        }
        return currentDominant;
    }, 'Idle');
};

const STATUS_POSITIONS: Record<Status | 'Idle', { top: string; left: string; area: string; }> = {
    'In Uitvoering': { top: '50%', left: '50%', area: 'Work Table' },
    'In Review': { top: '50%', left: '80%', area: 'Review Corner' },
    'Te Doen': { top: '85%', left: '20%', area: 'Lounge' },
    'Idle': { top: '85%', left: '25%', area: 'Lounge' },
    'Voltooid': { top: '15%', left: '15%', area: 'Chill Zone' },
    'Gearchiveerd': { top: '15%', left: '10%', area: 'Archive' },
    'Geannuleerd': { top: '15%', left: '5%', area: 'Archive' },
};


export default function TeamRoomPage() {
    const { users, loading: authLoading } = useAuth();
    const { tasks, loading: tasksLoading, setViewedUser } = useTasks();

    const userPositions = useMemo(() => {
        return users.map(user => {
            const status = getUserDominantStatus(tasks, user.id);
            const basePosition = STATUS_POSITIONS[status] || STATUS_POSITIONS['Idle'];
            
            // Add some jitter to avoid perfect overlap
            const topJitter = (Math.random() - 0.5) * 10;
            const leftJitter = (Math.random() - 0.5) * 10;

            return {
                user,
                style: {
                    top: `calc(${basePosition.top} + ${topJitter}%)`,
                    left: `calc(${basePosition.left} + ${leftJitter}%)`,
                },
                area: basePosition.area
            };
        });
    }, [users, tasks]);

    if (authLoading || tasksLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full">
            <div>
                <h1 className="text-3xl font-bold">Team Room</h1>
                <p className="text-muted-foreground">Een visuele representatie van de teamactiviteit.</p>
            </div>
            <div className="relative w-full h-[70vh] rounded-lg border-2 border-dashed bg-muted/50 overflow-hidden">
                {/* Room Zones */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-primary/10 rounded-lg flex items-center justify-center">
                    <p className="font-bold text-primary">Werkplek</p>
                </div>
                <div className="absolute top-1/2 right-4 -translate-y-1/2 w-1/4 h-1/4 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                     <p className="font-bold text-yellow-600">Review Hoek</p>
                </div>
                 <div className="absolute bottom-4 left-4 w-1/3 h-1/4 bg-green-500/10 rounded-lg flex items-center justify-center">
                     <p className="font-bold text-green-600">Lounge</p>
                </div>

                {/* User Avatars */}
                {userPositions.map(({ user, style }) => (
                     <TooltipProvider key={user.id}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
                                    style={style}
                                    onClick={() => setViewedUser(user)}
                                >
                                    <Avatar className="h-12 w-12 border-4 border-background shadow-md">
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{userPositions.find(p => p.user.id === user.id)?.area}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        </div>
    );
}
