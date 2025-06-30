
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, CheckCircle, HeartHandshake, Users, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MENTOR_THRESHOLD_POINTS = 100;
const MENTOR_THRESHOLD_TASKS = 10;

function UserCard({ user, completedTasks, onSelect }: { user: User; completedTasks: number; onSelect: (user: User) => void }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-around text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <span>{user.points.toLocaleString()} punten</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{completedTasks} taken</span>
                    </div>
                </div>
                 {user.skills && user.skills.length > 0 && (
                    <div className="pt-2 border-t">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Vaardigheden</h4>
                         <div className="flex flex-wrap gap-1">
                            {user.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                        </div>
                    </div>
                )}
                <Button className="w-full" onClick={() => onSelect(user)}>Bekijk Profiel</Button>
            </CardContent>
        </Card>
    )
}


export default function MentorshipPage() {
    const { users, loading: authLoading } = useAuth();
    const { tasks, loading: tasksLoading, navigateToUserProfile } = useTasks();

    const { mentors, mentees } = useMemo(() => {
        const usersWithStats = users.map(user => ({
            ...user,
            completedTasks: tasks.filter(t => t.status === 'Voltooid' && t.assigneeIds.includes(user.id)).length
        }));

        const potentialMentors = usersWithStats.filter(u => 
            u.points >= MENTOR_THRESHOLD_POINTS && u.completedTasks >= MENTOR_THRESHOLD_TASKS
        ).sort((a,b) => b.points - a.points);
        
        const potentialMentees = usersWithStats.filter(u => 
            !potentialMentors.some(m => m.id === u.id)
        ).sort((a,b) => a.points - b.points);

        return { mentors: potentialMentors, mentees: potentialMentees };

    }, [users, tasks]);

    if (authLoading || tasksLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const handleSelectUser = (user: User) => {
        navigateToUserProfile(user.id);
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><HeartHandshake /> Mentorschap Programma</h1>
                <p className="text-muted-foreground">Vind ervaren gebruikers om van te leren, of help nieuwkomers op weg.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <section>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Star className="text-yellow-500"/> Vind een Mentor</h2>
                    <div className="space-y-4">
                        {mentors.length > 0 ? (
                            mentors.map(user => <UserCard key={user.id} user={user} completedTasks={user.completedTasks} onSelect={handleSelectUser} />)
                        ) : (
                             <p className="text-muted-foreground text-center py-8">Er zijn momenteel geen actieve mentoren beschikbaar.</p>
                        )}
                    </div>
                </section>
                <section>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Users /> Help een Nieuwkomer</h2>
                    <div className="space-y-4">
                        {mentees.length > 0 ? (
                            mentees.map(user => <UserCard key={user.id} user={user} completedTasks={user.completedTasks} onSelect={handleSelectUser} />)
                        ) : (
                             <p className="text-muted-foreground text-center py-8">Iedereen is al een ervaren rot!</p>
                        )}
                    </div>
                </section>
            </div>

        </div>
    )
}
