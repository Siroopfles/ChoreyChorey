'use client';
import type { User } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Trophy, Sparkles } from 'lucide-react';

type LeaderboardProps = {
  users: User[];
};

const Leaderboard = ({ users }: LeaderboardProps) => {
  const sortedUsers = [...users].sort((a, b) => b.points - a.points);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-chart-3" />;
      case 1:
        return <Trophy className="h-5 w-5 text-muted-foreground" />;
      case 2:
        return <Sparkles className="h-5 w-5 text-chart-2" />;
      default:
        return <div className="w-5 text-center font-bold">{index + 1}</div>;
    }
  };

  return (
    <Card className="bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Trophy />
          Scorebord
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {sortedUsers.map((user, index) => (
            <li key={user.id} className="flex items-center gap-4">
              <div className="flex items-center justify-center w-6">{getRankIcon(index)}</div>
              <Avatar>
                <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-sidebar-foreground/80">{user.points.toLocaleString()} pts</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
