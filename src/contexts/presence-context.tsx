
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, Presence } from '@/lib/types';
import { useAuth } from './auth-context';
import { useOrganization } from './organization-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';

interface PresenceContextType {
  others: Record<string, Presence>;
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
  const presenceRef = useRef<any>(null);

  const updateMyPresence = useCallback(
    (position: { x: number; y: number } | null) => {
      if (!user || !currentOrganization) return;
      presenceRef.current = {
        ...presenceRef.current,
        cursor: position,
        lastSeen: serverTimestamp(),
      };
       setDoc(doc(db, 'presence', user.id), presenceRef.current, { merge: true });
    },
    [user, currentOrganization]
  );
  
  const throttledUpdate = useRef(throttle(updateMyPresence, 100)).current;

  useEffect(() => {
    if (!user || !currentOrganization) {
      setOthers({});
      return;
    }
    
    presenceRef.current = {
      id: user.id,
      organizationId: currentOrganization.id,
      name: user.name,
      avatar: user.avatar,
      cursor: null,
    };
    
    // Set initial presence and on disconnect
    const userPresenceDocRef = doc(db, 'presence', user.id);
    setDoc(userPresenceDocRef, presenceRef.current);
    
    const handleBeforeUnload = () => {
       deleteDoc(userPresenceDocRef);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Subscribe to others
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
      throttledUpdate({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
        throttledUpdate(null);
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

  }, [user, currentOrganization, throttledUpdate]);
  
  return (
    <PresenceContext.Provider value={{ others }}>
      {children}
    </PresenceContext.Provider>
  );
}
