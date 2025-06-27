
import { getPublicTeamData } from '@/app/actions/public.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Globe, ShieldAlert, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Task, Priority } from '@/lib/types';
import LandingHeader from '@/components/landing/header';
import LandingFooter from '@/components/landing/footer';

const priorityBorderColor: Record<string, string> = {
  'Urgent': 'border-chart-1',
  'Hoog': 'border-chart-2',
  'Midden': 'border-chart-3',
  'Laag': 'border-chart-4',
};

function PublicTaskCard({ task, users }: { task: Task, users: {id: string, name: string, avatar: string}[] }) {
    const assignees = task.assigneeIds.map(id => users.find(u => u.id === id)).filter(Boolean);
    const dueDate = task.dueDate ? new Date(task.dueDate) : undefined;
    
    let dateStatus = 'default';
    if (dueDate) {
        if (isBefore(new Date(dueDate), new Date())) dateStatus = 'overdue';
        else if (isToday(new Date(dueDate))) dateStatus = 'today';
    }

    return (
        <Card className={cn("border-l-4", priorityBorderColor[task.priority] || 'border-border')}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">{task.title}</CardTitle>
                <CardDescription>Status: <Badge variant="outline">{task.status}</Badge></CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center -space-x-2">
                         {assignees.length > 0 ? assignees.map(assignee => (
                             <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                                 <AvatarImage src={assignee.avatar} />
                                 <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                             </Avatar>
                         )) : <User className="h-5 w-5"/>}
                    </div>
                     {dueDate && (
                        <div className={cn('flex items-center gap-1.5', {'text-destructive': dateStatus === 'overdue', 'text-orange-500': dateStatus === 'today'})}>
                            <Calendar className="h-4 w-4" />
                            <span>{format(dueDate, 'd MMMM yyyy', { locale: nl })}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function isToday(date: Date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function isBefore(date1: Date, date2: Date) {
    return date1.getTime() < date2.getTime();
}

export default async function PublicTeamPage({ params }: { params: { teamId: string } }) {
    const data = await getPublicTeamData(params.teamId);

    if ('error' in data) {
        return (
            <div className="flex flex-col min-h-screen">
                 <LandingHeader />
                 <main className="flex-1 flex items-center justify-center">
                    <Card className="m-4 w-full max-w-lg text-center">
                        <CardHeader>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                                <ShieldAlert className="h-6 w-6 text-destructive" />
                            </div>
                            <CardTitle className="mt-4">Toegang Fout</CardTitle>
                            <CardDescription>{data.error}</CardDescription>
                        </CardHeader>
                    </Card>
                 </main>
                 <LandingFooter />
            </div>
        );
    }

    const { team, tasks, users } = data;

    const tasksByStatus: Record<string, Task[]> = tasks.reduce((acc, task) => {
        const status = task.status;
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    const orderedStatuses = team.settings?.customization?.statuses || ['Te Doen', 'In Uitvoering', 'In Review', 'Voltooid'];


    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <LandingHeader />
            <main className="flex-1 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold flex items-center gap-3">
                            <Globe className="text-primary" />
                            {team.name}
                        </h1>
                        <p className="text-lg text-muted-foreground">Openbaar overzicht</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       {orderedStatuses.map(status => (
                           <div key={status} className="flex flex-col gap-4">
                               <h2 className="text-lg font-semibold px-2">{status} ({tasksByStatus[status]?.length || 0})</h2>
                               <div className="bg-background/50 rounded-lg p-2 space-y-4 min-h-32">
                                {(tasksByStatus[status] || []).map(task => (
                                    <PublicTaskCard key={task.id} task={task} users={users} />
                                ))}
                               </div>
                           </div>
                       ))}
                       {tasks.length === 0 && (
                            <p className="md:col-span-2 lg:col-span-4 text-center text-muted-foreground py-12">
                               Er zijn geen openbare taken in dit team.
                            </p>
                        )}
                    </div>
                </div>
            </main>
            <LandingFooter />
        </div>
    );
}
