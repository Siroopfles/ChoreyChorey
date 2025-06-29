'use client';

import { useState, useMemo } from 'react';
import type { TeamChallenge } from '@/lib/types';
import { useGoals } from '@/contexts/goal-context';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, CheckCircle, MoreVertical, Edit, Trash2, Users, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ChallengeDialog } from './challenge-dialog';
import { PERMISSIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';

export function ChallengeCard({ challenge }: { challenge: TeamChallenge }) {
  const { deleteTeamChallenge, completeTeamChallenge } = useGoals();
  const { tasks } = useTasks();
  const { teams, users: allUsers, currentUserPermissions } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const canManageChallenges = currentUserPermissions.includes(PERMISSIONS.MANAGE_TEAMS);

  const { team, progress, current, metricLabel } = useMemo(() => {
    const team = teams.find(t => t.id === challenge.teamId);
    if (!team) {
      return { team: null, progress: 0, current: 0, metricLabel: '' };
    }

    const teamMemberIds = team.memberIds;
    let currentVal = 0;
    let label = '';
    
    if (challenge.metric === 'tasks_completed') {
      currentVal = tasks.filter(t => t.status === 'Voltooid' && t.assigneeIds.some(id => teamMemberIds.includes(id))).length;
      label = 'taken voltooid';
    } else { // points_earned
      const teamMembers = allUsers.filter(u => teamMemberIds.includes(u.id));
      currentVal = teamMembers.reduce((sum, member) => sum + (member.points || 0), 0);
      label = 'punten verdiend';
    }

    const progressPercentage = challenge.target > 0 ? (currentVal / challenge.target) * 100 : 0;
    
    return { team, progress: progressPercentage, current: currentVal, metricLabel: label };
  }, [challenge, teams, tasks, allUsers]);

  return (
    <>
      <Card className={cn("flex flex-col", challenge.status === 'completed' && "border-green-500/50 bg-green-500/10")}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
              {challenge.status === 'completed' ? <Trophy className="h-5 w-5 text-green-600" /> : <Trophy className="h-5 w-5 text-amber-500" /> }
              {challenge.title}
            </CardTitle>
             {canManageChallenges && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-md hover:bg-accent -mr-2 -mt-2"><MoreVertical className="h-4 w-4" /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Bewerken
                        </DropdownMenuItem>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4" /> Verwijderen
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Weet je het zeker?</AlertDialogTitle><AlertDialogDescription>Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Annuleren</AlertDialogCancel><AlertDialogAction onClick={() => deleteTeamChallenge(challenge.id)} className="bg-destructive hover:bg-destructive/90">Verwijderen</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
             )}
          </div>
          {challenge.description && <CardDescription className="line-clamp-2">{challenge.description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
            <div className="space-y-1">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{current.toLocaleString()} / {challenge.target.toLocaleString()} {metricLabel}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
            </div>
             <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground"/>
                <span className="font-semibold">{team?.name || 'Onbekend Team'}</span>
             </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            <div className="text-sm font-semibold flex items-center gap-1.5 text-amber-600">
                <Coins className="h-4 w-4" />
                <span>Beloning: {challenge.reward.toLocaleString()} punten</span>
            </div>
            {canManageChallenges && progress >= 100 && challenge.status === 'active' && (
                <Button onClick={() => completeTeamChallenge(challenge.id)}>Beloning Uitkeren</Button>
            )}
        </CardFooter>
      </Card>
      {isEditing && <ChallengeDialog open={isEditing} onOpenChange={setIsEditing} challenge={challenge} />}
    </>
  );
}
