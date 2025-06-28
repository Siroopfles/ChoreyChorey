
'use client';

import type { ActivityFeedItem, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Trophy, Heart, Star, Activity } from 'lucide-react';

const ICONS: Record<ActivityFeedItem['type'], React.ElementType> = {
  achievement: Trophy,
  kudos: Heart,
  rating: Star,
};

const COLORS: Record<ActivityFeedItem['type'], string> = {
  achievement: 'text-amber-500',
  kudos: 'text-pink-500',
  rating: 'text-yellow-500',
};

const renderDetails = (item: ActivityFeedItem, users: User[]) => {
  switch (item.type) {
    case 'achievement':
      return (
        <p>
          Gefeliciteerd! <span className="font-semibold">{item.userName}</span> heeft de prestatie <span className="font-semibold">&quot;{item.details.achievementName}&quot;</span> ontgrendeld!
        </p>
      );
    case 'kudos':
        const recipient = users.find(u => u.id === item.details.recipientId);
        return (
            <p>
                <span className="font-semibold">{item.userName}</span> heeft <span className="font-semibold">{recipient?.name || 'iemand'}</span> bedankt voor de taak &quot;{item.details.taskTitle}&quot; <span className="font-semibold text-green-600">(+{item.details.points} punten)</span>.
            </p>
        );
    case 'rating':
        const recipients = item.details.recipientIds?.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ') || 'het team';
        return (
            <p>
                <span className="font-semibold">{item.userName}</span> heeft de taak &quot;{item.details.taskTitle}&quot; van <span className="font-semibold">{recipients}</span> beoordeeld met {item.details.rating} sterren.
            </p>
        );
    default:
      return null;
  }
};

export function ActivityFeed({ items, users }: { items: ActivityFeedItem[]; users: User[] }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Activity />
            Recente Activiteit
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow min-h-0">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {items.length > 0 ? items.map(item => {
              const Icon = ICONS[item.type];
              const color = COLORS[item.type];
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-secondary ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-sm">
                    {renderDetails(item, users)}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: nl })}
                    </p>
                  </div>
                </div>
              );
            }) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                    Nog geen activiteit om weer te geven.
                </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
