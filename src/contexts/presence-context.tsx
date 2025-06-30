
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, Presence } from '@/lib/types';
import { useAuth } from './auth-context';
import { useOrganization } from './organization-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';

interface PresenceContextType {
  others: Record<string, Presence>;
  setViewingTask: (taskId: string | null) => void;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};

// A simple throttle function to limit the rate of execution.
const throttle = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: any[] | null = null;
  let lastThis: any;

  const later = () => {
    if (lastArgs) {
      func.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
      timeoutId = setTimeout(later, delay);
    } else {
      timeoutId = null;
    }
  };

  return function(this: any, ...args: any[]) {
    lastArgs = args;
    lastThis = this;
    if (!timeoutId) {
      later();
    }
  };
};

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [others, setOthers] = useState<Record<string, Presence>>({});
  const presenceRef = useRef<Partial<Presence>>({});

  const updateMyPresence = useCallback(
    (presenceUpdate: Partial<Omit<Presence, 'id' | 'organizationId'>>) => {
      if (!user || !currentOrganization) return;

      const newPresenceData = {
        id: user.id,
        organizationId: currentOrganization.id,
        name: user.name,
        avatar: user.avatar,
        ...presenceRef.current,
        ...presenceUpdate,
        lastSeen: serverTimestamp(),
      };
      
      presenceRef.current = newPresenceData;
      setDoc(doc(db, 'presence', user.id), newPresenceData, { merge: true });
    },
    [user, currentOrganization]
  );
  
  const throttledCursorUpdate = useRef(throttle((cursor: {x: number, y: number} | null) => {
      updateMyPresence({ cursor });
  }, 100)).current;

  const setViewingTask = useCallback((taskId: string | null) => {
      updateMyPresence({ viewingTaskId: taskId });
  }, [updateMyPresence]);
  
  useEffect(() => {
    if (!user || !currentOrganization) {
      setOthers({});
      return;
    }
    
    const userPresenceDocRef = doc(db, 'presence', user.id);
    
    const initialPresence = {
      id: user.id,
      organizationId: currentOrganization.id,
      name: user.name,
      avatar: user.avatar,
      cursor: null,
      viewingTaskId: null,
    };
    presenceRef.current = initialPresence;
    setDoc(userPresenceDocRef, { ...initialPresence, lastSeen: serverTimestamp() });
    
    const handleBeforeUnload = () => {
       deleteDoc(userPresenceDocRef);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const q = query(
      collection(db, 'presence'),
      where('organizationId', '==', currentOrganization.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newOthers: Record<string, Presence> = {};
      snapshot.forEach(doc => {
        if (doc.id !== user.id) {
          newOthers[doc.id] = doc.data() as Presence;
        }
      });
      setOthers(newOthers);
    });
    
    const handleMouseMove = (e: MouseEvent) => {
      throttledCursorUpdate({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
        throttledCursorUpdate(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      deleteDoc(userPresenceDocRef);
    };

  }, [user, currentOrganization, throttledCursorUpdate]);
  
  return (
    <PresenceContext.Provider value={{ others, setViewingTask }}>
      {children}
    </PresenceContext.Provider>
  );
}
