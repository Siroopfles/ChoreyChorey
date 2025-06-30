'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';
import { app } from '@/lib/firebase';
import { useAuth } from './auth-context';
import { manageFcmToken } from '@/app/actions/user.actions';
import { env } from '@/lib/env';

type FCMContextType = {
  requestPermission: () => Promise<void>;
};

const FCMContext = createContext<FCMContextType | undefined>(undefined);

export function FCMProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const messaging = getMessaging(app);

    const unsubscribeOnMessage = onMessage(messaging, (payload) => {
      console.log('Foreground message received.', payload);
      toast({
        title: payload.notification?.title || 'New Notification',
        description: payload.notification?.body || '',
      });
    });

    return () => {
      unsubscribeOnMessage();
    };
  }, [toast]);

  const requestPermission = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    
    if (!env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
      console.error("VAPID key is missing. Push notifications will not work.");
      toast({ title: 'Configuratie Fout', description: 'De VAPID-sleutel voor notificaties is niet ingesteld.', variant: 'destructive' });
      return;
    }

    try {
      const messaging = getMessaging(app);
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        toast({ title: 'Success', description: 'Notification permission granted.' });
        
        const currentToken = await getToken(messaging, {
          vapidKey: env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        if (currentToken) {
          await manageFcmToken(user.id, currentToken, 'add');
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      } else {
        toast({ title: 'Permission Denied', description: 'You will not receive push notifications.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('An error occurred while requesting permission. ', error);
      toast({ title: 'Error', description: 'Could not get notification permission.', variant: 'destructive' });
    }
  };

  return (
    <FCMContext.Provider value={{ requestPermission }}>
      {children}
    </FCMContext.Provider>
  );
}

export function useFCM() {
  const context = useContext(FCMContext);
  if (context === undefined) {
    throw new Error('useFCM must be used within a FCMProvider');
  }
  return context;
}
