
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
import TaskCard from '@/components/chorey/task-card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { KudosDialog } from '@/components/chorey/kudos-dialog';

const achievementIcons: Record<string, React.ElementType> = {
    'first_task': Rocket,
    'ten_tasks': Award,
    'community_helper': Users,
    'appreciated': Heart,
    'project_completed': Medal,
};

export default function UserProfilePage() {
    const { userId } = useParams();
    const router = useRouter();
    const { users, user: currentUser, loading: authLoading, projects } = useAuth();
    const { tasks, loading: tasksLoading } = useTasks();
    const [kudosDialogOpen, setKudosDialogOpen] = useState(false);

    const user = useMemo(() => {
        if (!userId) return null;
        return users.find(u => u.id === userId) || null;
    }, [userId, users]);

    const userTasks = useMemo(() => {
        if (!user) return [];
        return tasks.filter(task => task.assigneeIds.includes(user.id));
    }, [user, tasks]);
    
    const completedTasksCount = useMemo(() => {
        return userTasks.filter(t => t.status === 'Voltooid').length;
    }, [userTasks]);
    
    if (authLoading || tasksLoading) {
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

    return (
        <div className="space-y-6">
            <Button asChild variant="outline" size="sm" className="w-fit">
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Terug naar Dashboard
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Statistieken</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                             <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-secondary">
                                <Trophy className="h-6 w-6 text-amber-500"/>
                                <span className="text-xl font-bold">{user.points?.toLocaleString() || 0}</span>
                                <span className="text-xs text-muted-foreground">Punten</span>
                            </div>
                             <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-secondary">
                                <CheckCircle className="h-6 w-6 text-green-500"/>
                                <span className="text-xl font-bold">{completedTasksCount}</span>
                                <span className="text-xs text-muted-foreground">Taken Voltooid</span>
                            </div>
                        </CardContent>
                    </Card>

                     {(user.location || user.website || user.timezone) && (
                        <Card>
                            <CardContent className="pt-6 space-y-3 text-sm">
                                {user.location && <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground"/><span>{user.location}</span></div>}
                                {user.website && <div className="flex items-center gap-3"><Globe className="h-4 w-4 text-muted-foreground"/><a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{user.website}</a></div>}
                                {user.timezone && <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground"/><span>{user.timezone}</span></div>}
                            </CardContent>
                        </Card>
                    )}
                    
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
                </div>

                {/* Right Column - Activity */}
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Actieve Taken ({userTasks.filter(t => t.status !== 'Voltooid' && t.status !== 'Geannuleerd').length})</CardTitle>
                            <CardDescription>Taken waar {user.name} momenteel aan werkt.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {userTasks.filter(t => t.status !== 'Voltooid' && t.status !== 'Geannuleerd').length > 0 ? (
                                userTasks.filter(t => t.status !== 'Voltooid' && t.status !== 'Geannuleerd')
                                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                                  .map(task => <TaskCard key={task.id} task={task} users={users} currentUser={currentUser} projects={projects} />)
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
        </div>
    );
}
