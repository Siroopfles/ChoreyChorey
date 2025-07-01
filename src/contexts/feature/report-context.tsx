
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import type { ScheduledReport, ScheduledReportFormValues } from '@/lib/types/reports';
import { db } from '@/lib/core/firebase';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/user/auth-context';
import { manageScheduledReport as manageReportAction } from '@/app/actions/core/report.actions';

type ReportContextType = {
  scheduledReports: ScheduledReport[];
  loading: boolean;
  manageScheduledReport: (action: 'create' | 'update' | 'delete', data?: ScheduledReportFormValues, scheduleId?: string) => Promise<boolean>;
};

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: ReactNode }) {
  const { user, currentOrganization } = useAuth();
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    toast({ title: `Fout bij ${context}`, description: error.message, variant: 'destructive' });
  };

  useEffect(() => {
    if (!currentOrganization) {
      setScheduledReports([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const q = query(collection(db, 'scheduledReports'), where("organizationId", "==", currentOrganization.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setScheduledReports(snapshot.docs.map(d => ({ ...d.data(), id: d.id, createdAt: (d.data().createdAt as Timestamp).toDate(), lastSentAt: (d.data().lastSentAt as Timestamp)?.toDate() } as ScheduledReport)));
      setLoading(false);
    }, (e) => handleError(e, 'laden geplande rapporten'));

    return () => unsubscribe();
  }, [currentOrganization, toast]);

  const manageScheduledReport = async (action: 'create' | 'update' | 'delete', data?: ScheduledReportFormValues, scheduleId?: string) => {
    if (!user || !currentOrganization) {
      handleError({ message: 'Niet geautoriseerd' }, 'beheren geplande rapporten');
      return false;
    }
    const result = await manageReportAction(action, currentOrganization.id, user.id, { scheduleId, data });
    if (result.error) {
      handleError({ message: result.error }, 'beheren geplande rapporten');
      return false;
    }
    toast({ title: 'Gelukt!', description: `Rapportplanning is ${action === 'create' ? 'aangemaakt' : 'bijgewerkt'}.`});
    return true;
  };

  const value = {
    scheduledReports,
    loading,
    manageScheduledReport,
  };

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

export function useReports() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
}
