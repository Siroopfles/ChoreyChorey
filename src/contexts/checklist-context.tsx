'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import type { ChecklistTemplate, ChecklistTemplateFormValues } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './auth-context';
import { manageChecklistTemplate as manageAction } from '@/app/actions/checklist.actions';

type ChecklistContextType = {
  checklists: ChecklistTemplate[];
  loading: boolean;
  manageChecklist: (action: 'create' | 'update' | 'delete', data?: ChecklistTemplateFormValues, templateId?: string) => Promise<boolean>;
};

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const { user, currentOrganization } = useAuth();
  const [checklists, setChecklists] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentOrganization) {
      setChecklists([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const q = query(collection(db, 'checklistTemplates'), where("organizationId", "==", currentOrganization.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate()
      } as ChecklistTemplate));
      setChecklists(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching checklist templates:", error);
      toast({ title: "Fout bij laden", description: "Kon checklist templates niet laden.", variant: "destructive" });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentOrganization, toast]);

  const manageChecklist = async (action: 'create' | 'update' | 'delete', data?: ChecklistTemplateFormValues, templateId?: string): Promise<boolean> => {
    if (!user || !currentOrganization) return false;
    const result = await manageAction(action, currentOrganization.id, user.id, { templateId, data });
    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Succes!', description: `Checklist template succesvol ${action === 'create' ? 'aangemaakt' : action === 'update' ? 'bijgewerkt' : 'verwijderd'}.` });
    return true;
  };

  return (
    <ChecklistContext.Provider value={{ checklists, loading, manageChecklist }}>
      {children}
    </ChecklistContext.Provider>
  );
}

export function useChecklists() {
  const context = useContext(ChecklistContext);
  if (context === undefined) {
    throw new Error('useChecklists must be used within a ChecklistProvider');
  }
  return context;
}
