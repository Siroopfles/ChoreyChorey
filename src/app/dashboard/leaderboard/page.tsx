
'use client';

import { useState, useMemo } from 'react';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import type { User, Team } from '@/lib/types';
import { calculatePoints } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Trophy, Sparkles, Users as UsersIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const getRankIcon = (index: number) => {
  switch (index) {
    case 0:
      return <Crown className="h-6 w-6 text-yellow-400" />;
    case 1:
      return <Trophy className="h-6 w-6 text-gray-400" />;
    case 2:
      return <Sparkles className="h-6 w-6 text-orange-400" />;
    default:
      return <div className="w-6 text-center font-bold text-muted-foreground">{index + 1}</div>;
  }
};

function IndividualLeaderboard() {
  const { tasks, users, loading: tasksLoading } = useTasks();
  const { currentOrganization, loading: authLoading } = useAuth();
  const [selectedTag, setSelectedTag] = useState<string>('Algemeen');

  const allLabels = useMemo(() => currentOrganization?.settings?.customization?.labels || [], [currentOrganization]);

  const { sortedUsers, maxPoints } = useMemo(() => {
    let usersWithPoints: (User & { dynamicPoints: number; tasksCompleted: number })[];

    if (selectedTag === 'Algemeen') {
      usersWithPoints = [...users].map(u => ({ 
        ...u, 
        dynamicPoints: u.points,
        tasksCompleted: tasks.filter(t => t.status === 'Voltooid' && t.assigneeIds.includes(u.id)).length,
      }));
    } else {
      const pointsByTag: Record<string, { points: number; count: number }> = {};
      users.forEach(user => {
        pointsByTag[user.id] = { points: 0, count: 0 };
      });

      const relevantTasks = tasks.filter(task =>
        task.status === 'Voltooid' &&
        task.labels.includes(selectedTag)
      );

      relevantTasks.forEach(task => {
        const points = calculatePoints(task.priority, task.storyPoints);
        task.assigneeIds.forEach(assigneeId => {
          if (pointsByTag[assigneeId] !== undefined) {
            pointsByTag[assigneeId].points += points;
            pointsByTag[assigneeId].count += 1;
          }
        });
      });

      usersWithPoints = users.map(user => ({
        ...user,
        dynamicPoints: pointsByTag[user.id]?.points || 0,
        tasksCompleted: pointsByTag[user.id]?.count || 0,
      }));
    }
    
    const sorted = [...usersWithPoints].sort((a, b) => b.dynamicPoints - a.dynamicPoints);
    const max = sorted.length > 0 ? sorted[0].dynamicPoints : 0;

    return { sortedUsers: sorted, maxPoints: max > 0 ? max : 1 };

  }, [users, tasks, selectedTag]);
  
  return (
      <div className="space-y-4">
          <div className="flex justify-end">
            <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-[250px] bg-card">
                    <SelectValue placeholder="Kies een categorie" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Algemeen">Algemeen</SelectItem>
                    {allLabels.map(label => (
                        <SelectItem key={label} value={label}>{label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-4">
            <ul className="space-y-4">
                {sortedUsers.map((user, index) => (
                <li key={user.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                    <div className="flex items-center justify-center w-8">
                    {getRankIcon(index)}
                    </div>
                    <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                    <p className="font-semibold">{user.name}</p>
                    <Progress value={(user.dynamicPoints / maxPoints) * 100} className="h-2" />
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg">{user.dynamicPoints.toLocaleString()} pts</p>
                        <p className="text-xs text-muted-foreground">{user.tasksCompleted} taken</p>
                    </div>
                </li>
                ))}
            </ul>
            </CardContent>
        </Card>
      </div>
  );
}

function TeamLeaderboard() {
    const { users } = useTasks();
    const { teams } = useAuth();
    
    const { sortedTeams, maxPoints } = useMemo(() => {
        const usersById = new Map(users.map(u => [u.id, u]));
        const teamsWithPoints = teams.map(team => {
            const members = team.memberIds.map(id => usersById.get(id)).filter(Boolean) as User[];
            const totalPoints = members.reduce((sum, member) => sum + (member.points || 0), 0);
            return {
                ...team,
                members,
                totalPoints
            };
        });

        const sorted = [...teamsWithPoints].sort((a, b) => b.totalPoints - a.totalPoints);
        const max = sorted.length > 0 ? sorted[0].totalPoints : 0;
        return { sortedTeams: sorted, maxPoints: max > 0 ? max : 1 };
    }, [teams, users]);

    return (
        <Card>
            <CardContent className="p-4">
            <ul className="space-y-4">
                {sortedTeams.map((team, index) => (
                <li key={team.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                    <div className="flex items-center justify-center w-8">
                        {getRankIcon(index)}
                    </div>
                    <div className="flex -space-x-2">
                        <TooltipProvider>
                        {team.members.slice(0, 5).map(member => (
                            <Tooltip key={member.id}>
                                <TooltipTrigger asChild>
                                    <Avatar className="h-12 w-12 border-2 border-background">
                                        <AvatarImage src={member.avatar} alt={member.name} />
                                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{member.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                        </TooltipProvider>
                         {team.members.length > 5 && (
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-bold border-2 border-background">
                                +{team.members.length - 5}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-1">
                        <p className="font-semibold">{team.name}</p>
                        <Progress value={(team.totalPoints / maxPoints) * 100} className="h-2" />
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg">{team.totalPoints.toLocaleString()} pts</p>
                        <p className="text-xs text-muted-foreground">{team.members.length} leden</p>
                    </div>
                </li>
                ))}
            </ul>
            </CardContent>
        </Card>
    );
}


export default function LeaderboardPage() {
  const { loading: tasksLoading } = useTasks();
  const { loading: authLoading } = useAuth();
  
  if (tasksLoading || authLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Trophy /> Scorebord</h1>
          <p className="text-muted-foreground">Zie wie de meeste punten heeft, individueel of in teamverband.</p>
        </div>
      </div>
       <Tabs defaultValue="individual">
            <TabsList>
                <TabsTrigger value="individual">Individueel</TabsTrigger>
                <TabsTrigger value="team">Teams</TabsTrigger>
            </TabsList>
            <TabsContent value="individual" className="mt-4">
                <IndividualLeaderboard />
            </TabsContent>
            <TabsContent value="team" className="mt-4">
                <TeamLeaderboard />
            </TabsContent>
        </Tabs>
    </div>
  );
}
