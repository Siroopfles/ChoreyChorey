
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  onSnapshot, 
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import type { Idea, IdeaFormValues, IdeaStatus } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/user/auth-context';
import { useOrganization } from '@/contexts/system/organization-context';
import { createIdea as createIdeaAction, toggleIdeaUpvote as toggleIdeaUpvoteAction, updateIdeaStatus as updateIdeaStatusAction } from '@/app/actions/core/ideas.actions';

type IdeaContextType = {
  ideas: Idea[];
  loading: boolean;
  addIdea: (ideaData: IdeaFormValues) => Promise<boolean>;
  toggleIdeaUpvote: (ideaId: string) => void;
  updateIdeaStatus: (ideaId: string, status: IdeaStatus) => void;
};

const IdeaContext = createContext<IdeaContextType | undefined>(undefined);

export function IdeaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    toast({ title: `Fout bij ${context}`, description: error.message, variant: 'destructive' });
  };
  
  useEffect(() => {
    if (!currentOrganization) {
      setIdeas([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const ideasQuery = query(collection(db, 'ideas'), where("organizationId", "==", currentOrganization.id));
    
    const unsubscribeIdeas = onSnapshot(ideasQuery, (snapshot) => {
      const ideasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate()
      } as Idea));
      setIdeas(ideasData);
      setLoading(false);
    }, (e) => handleError(e, 'laden van ideeën'));
    
    return () => unsubscribeIdeas();
  }, [currentOrganization]);

  const addIdea = async (ideaData: IdeaFormValues): Promise<boolean> => {
    if (!user || !currentOrganization) return false;
    const result = await createIdeaAction(currentOrganization.id, user.id, ideaData);
    if (result.error) { 
      handleError({ message: result.error }, 'indienen idee'); 
      return false; 
    }
    toast({ title: 'Idee ingediend!', description: 'Bedankt voor je bijdrage.' });
    return true;
  };

  const toggleIdeaUpvote = async (ideaId: string) => {
    if (!user) return;
    const result = await toggleIdeaUpvoteAction(ideaId, user.id);
    if (result.error) { handleError({ message: result.error }, 'stemmen op idee'); }
  };

  const updateIdeaStatus = async (ideaId: string, status: IdeaStatus) => {
    if (!user || !currentOrganization) return;
    const result = await updateIdeaStatusAction(ideaId, status, user.id, currentOrganization.id);
    if (result.error) { 
      handleError({ message: result.error }, 'bijwerken idee status'); 
    } else { 
      toast({ title: 'Status bijgewerkt!' }); 
    }
  };
  
  return (
    <IdeaContext.Provider value={{ ideas, loading, addIdea, toggleIdeaUpvote, updateIdeaStatus }}>
      {children}
    </IdeaContext.Provider>
  );
}

export function useIdeas() {
  const context = useContext(IdeaContext);
  if (context === undefined) {
    throw new Error('useIdeas must be used within an IdeaProvider');
  }
  return context;
}
