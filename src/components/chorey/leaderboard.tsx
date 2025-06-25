'use client';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Trophy, Sparkles } from 'lucide-react';
import { useTasks } from '@/contexts/task-context';

type LeaderboardProps = {
  users: User[];
};

const Leaderboard = ({ users }: LeaderboardProps) => {
  const { setViewedUser } = useTasks();
  const sortedUsers = [...users].sort((a, b) => b.points - a.points);

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
      <h3 className="mb-4 text-lg font-semibold text-sidebar-primary flex items-center gap-2">
        <Trophy />
        Scorebord
      </h3>
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
                <p className="text-xs text-sidebar-foreground/80">{user.points.toLocaleString()} pts</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
