
'use server';

import { db } from '@/lib/core/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { ScheduledReportFormValues } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/types';

export async function manageScheduledReport(
  action: 'create' | 'update' | 'delete',
  organizationId: string,
  userId: string,
  payload: {
    scheduleId?: string;
    data?: ScheduledReportFormValues;
  }
): Promise<{ success: boolean; error?: string }> {
    // For now, let's assume anyone who can view reports can manage schedules.
    // This could be a separate permission in the future.
    if (!await hasPermission(userId, organizationId, PERMISSIONS.VIEW_ALL_TASKS)) {
        return { success: false, error: 'U heeft geen permissie om rapporten te beheren.' };
    }

  try {
    const { scheduleId, data } = payload;
    if (action === 'create' && data) {
      const newSchedule = {
        ...data,
        organizationId,
        creatorId: userId,
        createdAt: new Date(),
        lastSentAt: null,
      };
      await addDoc(collection(db, 'scheduledReports'), newSchedule);
      return { success: true };
    }
    
    if (action === 'update' && scheduleId && data) {
      const scheduleRef = doc(db, 'scheduledReports', scheduleId);
      await updateDoc(scheduleRef, data as any);
      return { success: true };
    }

    if (action === 'delete' && scheduleId) {
      const scheduleRef = doc(db, 'scheduledReports', scheduleId);
      await deleteDoc(scheduleRef);
      return { success: true };
    }

    throw new Error('Ongeldige actie of payload voor het beheren van gepland rapport.');
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
