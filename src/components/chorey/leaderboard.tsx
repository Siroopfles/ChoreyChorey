
'use client';
import type { User, Task } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Trophy, Sparkles } from 'lucide-react';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculatePoints } from '@/lib/utils';


type LeaderboardProps = {
  users: User[];
  tasks: Task[];
};

const Leaderboard = ({ users, tasks }: LeaderboardProps) => {
  const { setViewedUser } = useTasks();
  const { currentOrganization } = useAuth();
  const [selectedTag, setSelectedTag] = useState<string>('Algemeen');

  const allLabels = currentOrganization?.settings?.customization?.labels || [];

  const sortedUsers = useMemo(() => {
    if (selectedTag === 'Algemeen') {
      return [...users].map(u => ({ ...u, dynamicPoints: u.points })).sort((a, b) => b.dynamicPoints - a.dynamicPoints);
    }

    const pointsByTag: Record<string, number> = {};
    users.forEach(user => {
      pointsByTag[user.id] = 0;
    });

    const relevantTasks = tasks.filter(task =>
      task.status === 'Voltooid' &&
      task.labels.includes(selectedTag)
    );

    relevantTasks.forEach(task => {
      const points = calculatePoints(task.priority, task.storyPoints);
      task.assigneeIds.forEach(assigneeId => {
        if (pointsByTag[assigneeId] !== undefined) {
          pointsByTag[assigneeId] += points;
        }
      });
    });

    return users
      .map(user => ({
        ...user,
        dynamicPoints: pointsByTag[user.id] || 0,
      }))
      .sort((a, b) => b.dynamicPoints - a.dynamicPoints);

  }, [users, tasks, selectedTag]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 1:
        return <Trophy className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Sparkles className="h-5 w-5 text-orange-400" />;
      default:
        return <div className="w-5 text-center font-bold text-sidebar-foreground/60">{index + 1}</div>;
    }
  };

  return (
    <div>
      <h3 className="mb-2 text-lg font-semibold text-sidebar-primary flex items-center gap-2">
        <Trophy />
        Scorebord
      </h3>
      
      <Select value={selectedTag} onValueChange={setSelectedTag}>
          <SelectTrigger className="mb-4 bg-sidebar-accent border-sidebar-border focus:ring-sidebar-ring">
              <SelectValue placeholder="Kies een categorie" />
          </SelectTrigger>
          <SelectContent>
              <SelectItem value="Algemeen">Algemeen</SelectItem>
              {allLabels.map(label => (
                  <SelectItem key={label} value={label}>{label}</SelectItem>
              ))}
          </SelectContent>
      </Select>

      <ul className="space-y-1">
        {sortedUsers.map((user, index) => (
          <li key={user.id}>
            <button
              className="flex items-center gap-3 w-full text-left p-2 rounded-md hover:bg-sidebar-accent transition-colors"
              onClick={() => setViewedUser(user)}
            >
              <div className="flex items-center justify-center w-6">{getRankIcon(index)}</div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/80">{user.dynamicPoints.toLocaleString()} pts</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
