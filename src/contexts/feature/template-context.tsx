
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import type { TaskTemplate, TaskTemplateFormValues } from '@/lib/types/templates';
import { db } from '@/lib/core/firebase';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/user/auth-context';
import { addTemplate as addTemplateAction, updateTemplate as updateTemplateAction, deleteTemplate as deleteTemplateAction } from '@/app/actions/core/template.actions';

type TemplateContextType = {
  templates: TaskTemplate[];
  loading: boolean;
  addTemplate: (templateData: TaskTemplateFormValues) => Promise<void>;
  updateTemplate: (templateId: string, templateData: TaskTemplateFormValues) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
};

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export function TemplateProvider({ children }: { children: ReactNode }) {
  const { user, currentOrganization } = useAuth();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    toast({ title: `Fout bij ${context}`, description: error.message, variant: 'destructive' });
  };

  useEffect(() => {
    if (!currentOrganization) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const q = query(collection(db, 'taskTemplates'), where("organizationId", "==", currentOrganization.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTemplates(snapshot.docs.map(d => ({...d.data(), id: d.id, createdAt: (d.data().createdAt as Timestamp).toDate()} as TaskTemplate)));
      setLoading(false);
    }, (e) => handleError(e, 'laden van templates'));

    return () => unsubscribe();
  }, [currentOrganization, toast]);

  const addTemplate = async (templateData: TaskTemplateFormValues) => {
    if (!user || !currentOrganization) return;
    const { error } = await addTemplateAction(currentOrganization.id, user.id, templateData);
    if (error) { handleError({ message: error }, 'template toevoegen'); }
    else { toast({ title: 'Template Aangemaakt!' }); }
  };

  const updateTemplate = async (templateId: string, templateData: TaskTemplateFormValues) => {
    const { error } = await updateTemplateAction(templateId, templateData);
    if (error) { handleError({ message: error }, 'template bijwerken'); }
    else { toast({ title: 'Template Bijgewerkt!' }); }
  };

  const deleteTemplate = async (templateId: string) => {
    const { error } = await deleteTemplateAction(templateId);
    if (error) { handleError({ message: error }, 'template verwijderen'); }
    else { toast({ title: 'Template Verwijderd' }); }
  };

  const value = {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
}

export function useTemplates() {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
}
