
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/contexts/communication/notification-context';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils/utils';
import { isAfter } from 'date-fns';

export function NotificationDropdown() {
  const { notifications, markAllNotificationsAsRead, snoozeNotification } = useNotifications();
  const router = useRouter();

  const displayedNotifications = useMemo(() => {
    return notifications.filter(n => !n.snoozedUntil || isAfter(new Date(), n.snoozedUntil));
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return displayedNotifications.filter(n => !n.read).length;
  }, [displayedNotifications]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Notificaties">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 shrink-0 rounded-full p-0 flex items-center justify-center text-[10px]">
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span className="font-bold">Notificaties</span>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={markAllNotificationsAsRead}>
              Markeer als gelezen
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map(n => (
              <DropdownMenuItem key={n.id} className="group flex flex-col items-start gap-1 whitespace-normal" onSelect={(e) => e.preventDefault()}>
                <p className={cn("text-sm", !n.read ? 'font-semibold' : 'text-muted-foreground')}>{n.message}</p>
                <div className="w-full flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(n.createdAt, { addSuffix: true, locale: nl })}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    onClick={() => snoozeNotification(n.id)}
                  >
                    <Timer className="mr-1 h-3 w-3" />
                    Snooze
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center p-4">Geen notificaties</p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
