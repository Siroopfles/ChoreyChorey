
'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Trophy, CheckCircle, Award, Rocket, Users, Heart, Star, HandHeart, Medal, Briefcase, MapPin, Globe, Clock, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ACHIEVEMENTS, statusStyles } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { KudosDialog } from '@/components/chorey/kudos-dialog';
import { useOrganization } from '@/contexts/organization-context';
import EditTaskDialog from '@/components/chorey/edit-task-dialog';
import type { Task } from '@/lib/types';

const achievementIcons: Record<string, React.ElementType> = {
    'first_task': Rocket,
    'ten_tasks': Award,
    'community_helper': Users,
    'appreciated': Heart,
    'project_completed': Medal,
    'team_effort': Users,
    'project_dominators': Briefcase,
};

export default function UserProfilePage() {
    const { userId } = useParams();
    const router = useRouter();
    const { user: currentUser, loading: authLoading } = useAuth();
    const { users, projects, loading: orgLoading } = useOrganization();
    const { tasks, loading: tasksLoading } = useTasks();
    const [kudosDialogOpen, setKudosDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const user = useMemo(() => {
        if (!userId || !users) return null;
        return users.find(u => u.id === userId) || null;
    }, [userId, users]);

    const userTasks = useMemo(() => {
        if (!user) return [];
        return tasks.filter(task => task.assigneeIds.includes(user.id));
    }, [user, tasks]);
    
    const completedTasksCount = useMemo(() => {
        return userTasks.filter(t => t.status === 'Voltooid').length;
    }, [userTasks]);
    
    if (authLoading || tasksLoading || orgLoading) {
        return (
          <div className="flex h-full w-full items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }
    
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-lg text-muted-foreground">Gebruiker niet gevonden.</p>
                 <Button asChild variant="link" className="mt-4">
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Terug naar Dashboard
                    </Link>
                </Button>
            </div>
        )
    }
    
    const status = user.status?.type || 'Offline';
    const statusStyle = statusStyles[status] || statusStyles.Offline;
    const activeTasks = userTasks.filter(t => t.status !== 'Voltooid' && t.status !== 'Geannuleerd').sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
        <div className="space-y-6">
            <Button asChild variant="outline" size="sm" className="w-fit">
                <Link href="/dashboard/organization">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Terug naar Organisatie
                </Link>
            </Button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column - Profile Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                 <div className="relative">
                                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className={cn("absolute bottom-1 right-1 block h-5 w-5 rounded-full ring-2 ring-background", statusStyle.dot)} />
                                </div>
                                <h2 className="text-2xl font-bold mt-4">{user.name}</h2>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                {user.bio && <p className="mt-4 text-sm">{user.bio}</p>}
                                {currentUser && currentUser.id !== user.id && (
                                    <Button onClick={() => setKudosDialogOpen(true)} className="mt-4">
                                        <HandHeart className="mr-2 h-4 w-4" />
                                        Geef Kudos
                                    </Button>
                                )}
                            </div>
                            {(user.location || user.website || user.timezone) && (
                                <>
                                    <Separator className="my-4" />
                                    <div className="space-y-3 text-sm text-left">
                                        {user.location && <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground"/><span>{user.location}</span></div>}
                                        {user.website && <div className="flex items-center gap-3"><Globe className="h-4 w-4 text-muted-foreground"/><a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{user.website}</a></div>}
                                        {user.timezone && <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground"/><span>{user.timezone}</span></div>}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Activity */}
                <div className="lg:col-span-2 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Totaal Punten</CardTitle>
                                <Trophy className="h-4 w-4 text-muted-foreground text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{user.points?.toLocaleString() || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Taken Voltooid</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{completedTasksCount}</div>
                            </CardContent>
                        </Card>
                     </div>

                    {user.skills && user.skills.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Vaardigheden</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {user.skills.map(skill => <Badge key={skill}>{skill}</Badge>)}
                            </CardContent>
                        </Card>
                    )}

                    {user.achievements && user.achievements.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Prestaties</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {user.achievements.map(achId => {
                                    const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achId);
                                    if (!achievement) return null;
                                    const Icon = achievementIcons[achId];
                                    return <Badge key={achId} variant="secondary" className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700">{Icon && <Icon className="h-3 w-3 mr-1.5"/>}{achievement.name}</Badge>
                                })}
                            </CardContent>
                        </Card>
                    )}

                     <Card>
                        <CardHeader>
                            <CardTitle>Actieve Taken ({activeTasks.length})</CardTitle>
                            <CardDescription>Taken waar {user.name} momenteel aan werkt.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {activeTasks.length > 0 ? (
                                activeTasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => setEditingTask(task)}
                                        className="w-full text-left flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                                    >
                                        <p className="font-medium">{task.title}</p>
                                        <Badge variant="outline">{task.status}</Badge>
                                    </button>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-4">Geen actieve taken.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
             {currentUser && currentUser.id !== user.id && (
                <KudosDialog
                    open={kudosDialogOpen}
                    onOpenChange={setKudosDialogOpen}
                    recipient={user}
                />
            )}
             {editingTask && (
                <EditTaskDialog
                  isOpen={!!editingTask}
                  setIsOpen={(isOpen) => { if (!isOpen) setEditingTask(null); }}
                  task={editingTask}
                  users={users}
                />
            )}
        </div>
    );
}
