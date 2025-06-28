
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import type { Automation, Task } from './types';
import { createNotification } from '@/app/actions/notification.actions';

function addHistoryEntry(userId: string | null, action: string, details?: string) {
    return {
        id: crypto.randomUUID(),
        userId: userId || 'system',
        timestamp: new Date(),
        action,
        details,
    };
};

async function executeTaskAssignAction(task: Task, automation: Automation) {
    if (!automation.action.params.assigneeId) return;

    const taskRef = doc(db, 'tasks', task.id);
    const newAssigneeId = automation.action.params.assigneeId;

    await updateDoc(taskRef, {
        assigneeIds: arrayUnion(newAssigneeId),
        history: arrayUnion(addHistoryEntry('system', 'Taak toegewezen via automatisering', `"${automation.name}"`))
    });
    
    await createNotification(
        newAssigneeId,
        `Je bent automatisch toegewezen aan taak: "${task.title}" via automatisering "${automation.name}"`,
        task.id,
        task.organizationId,
        'system'
    );
}

export async function processTriggers(event: 'task.created', data: { task: Task }) {
    const { task } = data;
    const { organizationId } = task;

    // Fetch all enabled automations for this organization and event type
    const automationsQuery = query(
        collection(db, 'automations'),
        where('organizationId', '==', organizationId),
        where('enabled', '==', true),
        where('trigger.type', '==', event)
    );
    const snapshot = await getDocs(automationsQuery);
    if (snapshot.empty) return;

    const automations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Automation));

    for (const automation of automations) {
        // Check filters
        let filtersMatch = true;
        const filters = automation.trigger.filters;
        if (filters) {
            if (filters.priority && filters.priority !== task.priority) {
                filtersMatch = false;
            }
            if (filters.label && !task.labels.includes(filters.label)) {
                filtersMatch = false;
            }
        }
        
        if (!filtersMatch) continue;
        
        // Execute action
        switch (automation.action.type) {
            case 'task.assign':
                await executeTaskAssignAction(task, automation);
                break;
            // Future actions here...
            default:
                console.warn(`Unknown automation action type: ${automation.action.type}`);
        }
    }
}
