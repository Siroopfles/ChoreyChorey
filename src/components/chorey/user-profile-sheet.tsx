'use client';

import type { User, Task, Priority } from '@/lib/types';
import { ACHIEVEMENTS } from '@/lib/types';
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
import { CheckCircle, Trophy, Award, Rocket, Users, Heart, Star, HandHeart } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';
import { Button } from '../ui/button';
import { KudosDialog } from './kudos-dialog';


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
};

function UserStats({ user, userTasks }: { user: User; userTasks: Task[] }) {
  const completedTasks = userTasks.filter(t => t.status === 'Voltooid').length;

  return (
    <div className="grid grid-cols-2 gap-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totaal Punten</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{user.points.toLocaleString()}</div>
            </CardContent>
        </Card>
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
    if (!user.achievements || user.achievements.length === 0) {
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

function UserSkills({ user }: { user: User }) {
    if (!user.skills || user.skills.length === 0) {
        return null;
    }

    return (
        <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">VAARDIGHEDEN</h4>
            <div className="flex flex-wrap gap-2">
                {user.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1.5">
                       <Star className="h-3 w-3 text-amber-500" />
                       {skill}
                    </Badge>
                ))}
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
  const { user: currentUser } = useAuth();
  const [isKudosDialogOpen, setIsKudosDialogOpen] = useState(false);
  
  const userTasks = tasks.filter(task => task.assigneeIds.includes(user.id));
  const currentTasks = userTasks.filter(t => t.status === 'Te Doen' || t.status === 'In Uitvoering' || t.status === 'In Review');
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col sm:max-w-md">
          <SheetHeader className="text-left">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-2xl">{user.name}</SheetTitle>
                    <SheetDescription>
                      Een gewaardeerd teamlid
                    </SheetDescription>
                  </div>
              </div>
               {!isOwnProfile && (
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
              <UserSkills user={user} />
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
      {!isOwnProfile && (
        <KudosDialog
            open={isKudosDialogOpen}
            onOpenChange={setIsKudosDialogOpen}
            recipient={user}
        />
      )}
    </>
  );
}