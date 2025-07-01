
'use client';

import { useNotifications } from '@/contexts/communication/notification-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow, isSameDay, startOfYesterday } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Check, Archive, Mail, Bell, CheckCheck } from 'lucide-react';
import type { Notification } from '@/lib/types';
import { useRouter } from 'next/navigation';

function NotificationItem({ notification, onMarkRead, onArchive }: { notification: Notification; onMarkRead: (id: string) => void; onArchive: (id: string) => void; }) {
  const router = useRouter();

  const handleNavigate = () => {
    if (notification.taskId) {
      // A more robust solution would be a global state to open the task dialog directly.
      // For now, we navigate to the dashboard where the user can find the task.
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex-1">
        <p className={`text-sm ${!notification.read ? 'font-semibold' : 'text-muted-foreground'}`}>{notification.message}</p>
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
          <Bell className="h-3 w-3" />
          <span>{formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: nl })}</span>
          {notification.taskId && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleNavigate}>
              Bekijk taak
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {!notification.read && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMarkRead(notification.id)} title="Markeer als gelezen">
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onArchive(notification.id)} title="Archiveer">
          <Archive className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const { notifications, markSingleNotificationAsRead, archiveNotification, markAllNotificationsAsRead } = useNotifications();
  
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const today = new Date();
    const yesterday = startOfYesterday();
    let group = 'Ouder';
    if (isSameDay(notification.createdAt, today)) {
      group = 'Vandaag';
    } else if (isSameDay(notification.createdAt, yesterday)) {
      group = 'Gisteren';
    }
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Inbox</h1>
          {unreadCount > 0 && (
              <Button onClick={markAllNotificationsAsRead}>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Markeer alles als gelezen
              </Button>
          )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Alles ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Ongelezen ({unreadCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
            {Object.keys(groupedNotifications).length > 0 ? Object.entries(groupedNotifications).map(([group, notifs]) => (
                <div key={group} className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">{group}</h2>
                    <Card>
                      <CardContent className="p-0 divide-y">
                        {notifs.map(n => <NotificationItem key={n.id} notification={n} onMarkRead={markSingleNotificationAsRead} onArchive={archiveNotification} />)}
                      </CardContent>
                    </Card>
                </div>
            )) : <EmptyState />}
        </TabsContent>
        <TabsContent value="unread">
             {notifications.filter(n => !n.read).length > 0 ? (
                <Card className="mt-6">
                    <CardContent className="p-0 divide-y">
                       {notifications.filter(n => !n.read).map(n => <NotificationItem key={n.id} notification={n} onMarkRead={markSingleNotificationAsRead} onArchive={archiveNotification} />)}
                    </CardContent>
                </Card>
             ) : <EmptyState />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[400px] mt-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Mail className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Alles is afgehandeld!</h3>
            <p className="text-sm text-muted-foreground">Je hebt geen nieuwe notificaties.</p>
        </div>
    )
}
