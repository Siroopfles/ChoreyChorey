
'use server';

import type { Task } from '@/lib/types';
import { createCalendarEvent as createGoogleEvent, updateCalendarEvent as updateGoogleEvent, deleteCalendarEvent as deleteGoogleEvent } from '@/lib/integrations/google-calendar-service';
import { createMicrosoftCalendarEvent as createMicrosoftEvent, updateMicrosoftCalendarEvent as updateMicrosoftEvent, deleteMicrosoftCalendarEvent as deleteMicrosoftEvent } from '@/lib/integrations/microsoft-graph-service';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/core/firebase';

async function syncEvent(task: Task, creatorId: string) {
    if (!task.dueDate) {
        if (task.googleEventId) await deleteGoogleEvent(creatorId, task.googleEventId);
        if (task.microsoftEventId) await deleteMicrosoftEvent(creatorId, task.microsoftEventId);
        return;
    }

    if (task.googleEventId) {
        await updateGoogleEvent(creatorId, task);
    } else {
        const eventId = await createGoogleEvent(creatorId, task);
        if (eventId) {
            await updateDoc(doc(db, 'tasks', task.id), { googleEventId: eventId });
        }
    }

    if (task.microsoftEventId) {
        await updateMicrosoftEvent(creatorId, task);
    } else {
        const eventId = await createMicrosoftEvent(creatorId, task);
        if (eventId) {
            await updateDoc(doc(db, 'tasks', task.id), { microsoftEventId: eventId });
        }
    }
}

async function deleteSyncedEvent(task: Task) {
    if (!task.creatorId) return;
    if (task.googleEventId) {
        await deleteGoogleEvent(task.creatorId, task.googleEventId);
    }
    if (task.microsoftEventId) {
        await deleteMicrosoftEvent(task.creatorId, task.microsoftEventId);
    }
}

export const CalendarSyncService = {
  syncEvent,
  deleteSyncedEvent,
};
