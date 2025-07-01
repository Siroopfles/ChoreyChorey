
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import type { Automation, AutomationFormValues } from '@/lib/types/automations';
import { db } from '@/lib/core/firebase';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/user/auth-context';
import { manageAutomation as manageAutomationAction } from '@/app/actions/core/automation.actions';

type AutomationContextType = {
  automations: Automation[];
  loading: boolean;
  manageAutomation: (action: 'create' | 'update' | 'delete', data: AutomationFormValues, automation?: Automation) => Promise<boolean>;
};

const AutomationContext = createContext<AutomationContextType | undefined>(undefined);

export function AutomationProvider({ children }: { children: ReactNode }) {
  const { user, currentOrganization } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    toast({ title: `Fout bij ${context}`, description: error.message, variant: 'destructive' });
  };

  useEffect(() => {
    if (!currentOrganization) {
      setAutomations([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const q = query(collection(db, 'automations'), where("organizationId", "==", currentOrganization.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAutomations(snapshot.docs.map(d => ({...d.data(), id: d.id, createdAt: (d.data().createdAt as Timestamp).toDate()} as Automation)));
      setLoading(false);
    }, (e) => handleError(e, 'laden van automatiseringen'));

    return () => unsubscribe();
  }, [currentOrganization, toast]);

  const manageAutomation = async (action: 'create' | 'update' | 'delete', data: AutomationFormValues, automation?: Automation) => {
    if (!user || !currentOrganization) {
      handleError({ message: 'Niet geautoriseerd' }, 'beheren automatisering');
      return false;
    }
    const result = await manageAutomationAction(action, currentOrganization.id, user.id, {
      automationId: automation?.id,
      data,
    });
    if (result.error) {
      handleError({ message: result.error }, 'beheren automatisering');
      return false;
    }
    toast({ title: 'Gelukt!', description: `Automatisering is ${action === 'create' ? 'aangemaakt' : action === 'update' ? 'bijgewerkt' : 'verwijderd'}.`});
    return true;
  };

  const value = {
    automations,
    loading,
    manageAutomation,
  };

  return <AutomationContext.Provider value={value}>{children}</AutomationContext.Provider>;
}

export function useAutomations() {
  const context = useContext(AutomationContext);
  if (context === undefined) {
    throw new Error('useAutomations must be used within an AutomationProvider');
  }
  return context;
}
