
'use client';

import type { User, Task, Priority } from '@/lib/types';
import { ACHIEVEMENTS, statusStyles } from '@/lib/types';
import { useTasks } from '@/contexts/task-context';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Trophy, Award, Rocket, Users, Heart, Star, HandHeart, Medal } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';
import { Button } from '../ui/button';
import { KudosDialog } from './kudos-dialog';
import { toggleSkillEndorsement } from '@/app/actions/user.actions';
import { useToast } from '@/hooks/use-toast';


const priorityBorderColors: Record<Priority, string> = {
  'Urgent': 'border-chart-1',
  'Hoog': 'border-chart-2',
  'Midden': 'border-chart-3',
  'Laag': 'border-chart-4',
};

const achievementIcons: Record<string, React.ElementType> = {
    'first_task': Rocket,
    'ten_tasks': Award,
    'community_helper': Users,
    'appreciated': Heart,
    'project_completed': Medal,
};

function UserStats({ user, userTasks }: { user: User; userTasks: Task[] }) {
  const { currentOrganization } = useAuth();
  const showGamification = currentOrganization?.settings?.features?.gamification !== false;
  const completedTasks = userTasks.filter(t => t.status === 'Voltooid').length;

  return (
    <div className="grid grid-cols-2 gap-4">
        {showGamification && (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Totaal Punten</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{user.points.toLocaleString()}</div>
                </CardContent>
            </Card>
        )}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taken Voltooid</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{completedTasks}</div>
            </CardContent>
        </Card>
    </div>
  );
}

function Achievements({ user }: { user: User }) {
    const { currentOrganization } = useAuth();
    const showGamification = currentOrganization?.settings?.features?.gamification !== false;
    
    if (!showGamification || !user.achievements || user.achievements.length === 0) {
        return null;
    }
    
    const achievementDetails = Object.values(ACHIEVEMENTS);

    return (
        <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">PRESTATIES</h4>
            <TooltipProvider>
                <div className="flex flex-wrap gap-2">
                    {user.achievements.map(achId => {
                        const achievement = achievementDetails.find(a => a.id === achId);
                        if (!achievement) return null;
                        const Icon = achievementIcons[achId];
                        return (
                             <Tooltip key={achId}>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 rounded-full border bg-background p-1 pr-3 text-sm">
                                        {Icon && <div className="bg-yellow-400 text-white rounded-full p-1"><Icon className="h-4 w-4" /></div>}
                                        <span>{achievement.name}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{achievement.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </div>
            </TooltipProvider>
        </div>
    )
}

function UserSkills({ user, isOwnProfile }: { user: User, isOwnProfile: boolean }) {
    const { user: currentUser, users: allUsers, refreshUser } = useAuth();
    const { toast } = useToast();

    if (!user.skills || user.skills.length === 0) {
        return null;
    }

    const handleEndorse = async (skill: string) => {
        if (!currentUser || isOwnProfile) return;
        
        const result = await toggleSkillEndorsement(user.id, skill, currentUser.id);
        if (result.error) {
            toast({ title: 'Fout', description: result.error, variant: 'destructive' });
        } else {
            // No toast on success, the UI update is enough feedback
            await refreshUser(); // Refresh all user data to see changes
        }
    };

    return (
        <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">VAARDIGHEDEN</h4>
            <div className="flex flex-col gap-4">
                {user.skills.map(skill => {
                    const endorsers = (user.endorsements?.[skill] || []).map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
                    const currentUserHasEndorsed = endorsers.some(e => e.id === currentUser?.id);

                    return (
                        <div key={skill} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="flex items-center gap-1.5">
                                   <Star className="h-3 w-3 text-amber-500" />
                                   {skill}
                                </Badge>
                                {endorsers.length > 0 && (
                                     <TooltipProvider>
                                        <div className="flex -space-x-1">
                                            {endorsers.slice(0, 5).map(endorser => (
                                                <Tooltip key={endorser.id}>
                                                    <TooltipTrigger asChild>
                                                        <Avatar className="h-5 w-5 border-2 border-background">
                                                            <AvatarImage src={endorser.avatar} />
                                                            <AvatarFallback>{endorser.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{endorser.name}</TooltipContent>
                                                </Tooltip>
                                            ))}
                                            {endorsers.length > 5 && (
                                                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold border-2 border-background">
                                                    +{endorsers.length - 5}
                                                </div>
                                            )}
                                        </div>
                                     </TooltipProvider>
                                )}
                            </div>
                            {!isOwnProfile && currentUser && (
                                <Button size="sm" variant={currentUserHasEndorsed ? "default" : "outline"} onClick={() => handleEndorse(skill)}>
                                    <Star className={cn("mr-2 h-4 w-4", currentUserHasEndorsed && "fill-current")} />
                                    {endorsers.length}
                                </Button>
                            )}
                            {isOwnProfile && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Star className="mr-2 h-4 w-4 text-amber-500" />
                                    {endorsers.length}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    )
}


export default function UserProfileSheet({
  user,
  isOpen,
  onOpenChange,
}: {
  user: User;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { tasks } = useTasks();
  const { user: currentUser, currentOrganization } = useAuth();
  const [isKudosDialogOpen, setIsKudosDialogOpen] = useState(false);
  
  const userTasks = tasks.filter(task => task.assigneeIds.includes(user.id));
  const currentTasks = userTasks.filter(t => t.status === 'Te Doen' || t.status === 'In Uitvoering' || t.status === 'In Review');
  const isOwnProfile = currentUser?.id === user.id;
  const showGamification = currentOrganization?.settings?.features?.gamification !== false;
  const status = user.status?.type || 'Offline';
  const statusStyle = statusStyles[status] || statusStyles.Offline;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col sm:max-w-md">
          <SheetHeader className="text-left">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                            <Avatar className="h-16 w-16 border-2 border-primary">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className={cn("absolute bottom-0 right-0 block h-4 w-4 rounded-full ring-2 ring-background", statusStyle.dot)} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{statusStyle.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                    <div>
                        <SheetTitle className="text-2xl">{user.name}</SheetTitle>
                        <SheetDescription>
                        Een gewaardeerd teamlid
                        </SheetDescription>
                    </div>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className={cn("w-2 h-2 rounded-full", statusStyle.dot)} />
                    <span>{statusStyle.label}</span>
                </div>
              </div>
               {!isOwnProfile && showGamification && (
                <Button variant="outline" size="sm" onClick={() => setIsKudosDialogOpen(true)}>
                  <HandHeart className="mr-2 h-4 w-4" />
                  Geef Kudos
                </Button>
              )}
            </div>
          </SheetHeader>
          
          <div className="space-y-4 py-4">
              <UserStats user={user} userTasks={userTasks} />
              <Achievements user={user} />
              <UserSkills user={user} isOwnProfile={isOwnProfile} />
          </div>

          <Separator />

          <div className="flex-1 overflow-y-auto space-y-4 pt-4">
              <h4 className="text-sm font-medium text-muted-foreground">HUIDIGE TAKEN ({currentTasks.length})</h4>
              {currentTasks.length > 0 ? (
                  <div className="space-y-2">
                      {currentTasks.map(task => (
                          <div key={task.id} className={cn("flex flex-col rounded-md border p-3 border-l-4", priorityBorderColors[task.priority])}>
                              <p className="font-semibold text-sm">{task.title}</p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                <span>Status: {task.status}</span>
                                {task.dueDate && <span>Einddatum: {format(task.dueDate, 'd MMM', {locale: nl})}</span>}
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center text-sm text-muted-foreground py-8">
                      Geen actieve taken toegewezen.
                  </div>
              )}
          </div>
        </SheetContent>
      </Sheet>
      {!isOwnProfile && showGamification && (
        <KudosDialog
            open={isKudosDialogOpen}
            onOpenChange={setIsKudosDialogOpen}
            recipient={user}
        />
      )}
    </>
  );
}
