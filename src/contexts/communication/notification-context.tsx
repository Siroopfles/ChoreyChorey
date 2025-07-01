
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  Timestamp,
  writeBatch,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { NOTIFICATION_SOUNDS } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/user/auth-context';
import { addHours } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ToastAction } from '@/components/ui/toast';

type NotificationContextType = {
  notifications: Notification[];
  loading: boolean;
  markAllNotificationsAsRead: () => Promise<void>;
  markSingleNotificationAsRead: (notificationId: string) => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  snoozeNotification: (notificationId: string) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const prevNotificationsRef = useRef<Notification[]>([]);

  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    toast({ title: `Fout bij ${context}`, description: error.message, variant: 'destructive' });
  };

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.id)
    );
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: (d.data().createdAt as Timestamp).toDate(),
        snoozedUntil: (d.data().snoozedUntil as Timestamp)?.toDate()
      } as Notification))
      .filter(n => !n.archived)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setNotifications(notificationsData);
      setLoading(false);
    }, (e) => {
      handleError(e, 'laden van notificaties');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  useEffect(() => {
    if (loading || authLoading) {
      prevNotificationsRef.current = notifications;
      return;
    }
    if (!user || notifications.length === prevNotificationsRef.current.length) {
      prevNotificationsRef.current = notifications;
      return;
    }
    
    const newNotifications = notifications.filter(
      n => !prevNotificationsRef.current.some(pn => pn.id === n.id) && !n.read
    );

    if (newNotifications.length > 0) {
      const latestNotification = newNotifications[0];
      
      // Play sound
      const eventType = latestNotification.eventType || 'default';
      const soundSettings = user.notificationSounds || {};
      const soundToPlay = soundSettings[eventType] || soundSettings['default'] || NOTIFICATION_SOUNDS[1].id;

      if (soundToPlay && soundToPlay !== 'none') {
        const audio = new Audio(`/sounds/${soundToPlay}`);
        audio.play().catch(error => console.error("Audio playback failed:", error));
      }
      
      // Show toast
      toast({
        title: "Nieuwe Notificatie",
        description: latestNotification.message,
        action: latestNotification.taskId ? (
          <ToastAction altText="Bekijken" onClick={() => router.push(`/dashboard`)}>
            Bekijken
          </ToastAction>
        ) : undefined,
      });
    }

    prevNotificationsRef.current = notifications;
  }, [notifications, user, loading, authLoading, toast, router]);

  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if(unreadIds.length === 0) return;
    try {
      const batch = writeBatch(db);
      unreadIds.forEach(id => batch.update(doc(db, 'notifications', id), { read: true }));
      await batch.commit();
    } catch(e) { handleError(e, 'bijwerken van notificaties'); }
  };

  const markSingleNotificationAsRead = async (notificationId: string) => {
    try { await updateDoc(doc(db, 'notifications', notificationId), { read: true }); }
    catch (e) { handleError(e, 'bijwerken van notificatie'); }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { archived: true });
      toast({ title: 'Notificatie gearchiveerd.' });
    } catch (e) { handleError(e, 'archiveren van notificatie'); }
  };

  const snoozeNotification = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { snoozedUntil: Timestamp.fromDate(addHours(new Date(), 1)) });
    } catch (e) { handleError(e, 'snoozen van notificatie'); }
  };

  const value = {
    notifications,
    loading,
    markAllNotificationsAsRead,
    markSingleNotificationAsRead,
    archiveNotification,
    snoozeNotification,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
