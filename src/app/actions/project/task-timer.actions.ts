
'use server';

import { db } from '@/lib/core/firebase';
import { doc, getDoc, updateDoc, Timestamp, deleteField, arrayUnion } from 'firebase/firestore';
import type { Task, Organization, User } from '@/lib/types';
import { triggerWebhooks } from '@/lib/integrations/webhook-service';
import { addHistoryEntry } from '@/lib/utils/history-utils';
import { formatTime } from '@/lib/utils/time-utils';
import { createTogglTimeEntry } from '@/lib/integrations/toggl-service';
import { createClockifyTimeEntry } from '@/lib/integrations/clockify-service';

export async function toggleTaskTimerAction(taskId: string, userId: string, organizationId: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    try {
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (!orgDoc.exists()) {
             throw new Error("Organisatie niet gevonden.");
        }
        const organization = orgDoc.data() as Organization;

        if (organization.settings?.features?.timeTracking === false) {
            return { data: null, error: 'Tijdregistratie is uitgeschakeld voor deze organisatie.' };
        }
        
        const taskRef = doc(db, "tasks", taskId);
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) throw new Error("Taak niet gevonden");
        const task = taskDoc.data() as Task;
        
        const activeTimers = (task.activeTimerStartedAt || {}) as Record<string, Timestamp>;
        const myTimerIsRunning = !!activeTimers[userId];

        if (myTimerIsRunning) {
            // Stop timer
            const startTime = activeTimers[userId].toDate();
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            const newTimeLogged = (task.timeLogged || 0) + elapsed;
            
            await updateDoc(taskRef, {
                timeLogged: newTimeLogged,
                [`activeTimerStartedAt.${userId}`]: deleteField(),
                history: arrayUnion(addHistoryEntry(userId, 'Tijdregistratie gestopt', `Totaal gelogd: ${formatTime(newTimeLogged)}`))
            });
            await triggerWebhooks(organizationId, 'task.updated', {...task, timeLogged: newTimeLogged, activeTimerStartedAt: activeTimers, id: taskId});
            
            const userDoc = await getDoc(doc(db, 'users', userId));
            const user = userDoc.data() as User;

            // Toggl Integration
            if (organization.settings?.features?.toggl && user.togglApiToken && task.togglWorkspaceId && task.togglProjectId) {
                try {
                    await createTogglTimeEntry(user.togglApiToken, task.togglWorkspaceId, task, elapsed, startTime);
                } catch (togglError) {
                    console.error('Failed to sync time entry to Toggl:', togglError);
                }
            }

            // Clockify Integration
            if (organization.settings?.features?.clockify && user.clockifyApiToken && task.clockifyWorkspaceId && task.clockifyProjectId) {
                try {
                    await createClockifyTimeEntry(user.clockifyApiToken, task.clockifyWorkspaceId, task, elapsed, startTime);
                } catch (clockifyError) {
                    console.error('Failed to sync time entry to Clockify:', clockifyError);
                }
            }

        } else {
            // Start timer
            await updateDoc(taskRef, {
                [`activeTimerStartedAt.${userId}`]: new Date(),
                history: arrayUnion(addHistoryEntry(userId, 'Tijdregistratie gestart'))
            });
            await triggerWebhooks(organizationId, 'task.updated', {...task, activeTimerStartedAt: { ...activeTimers, [userId]: new Date() }, id: taskId});
        }
        return { data: { success: true }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}
