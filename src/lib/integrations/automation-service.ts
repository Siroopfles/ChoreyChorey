
'use server';

import { db } from '@/lib/core/firebase';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import type { Automation, Task, Priority, Label, Comment } from '@/lib/types';
import { createNotification } from '@/app/actions/core/notification.actions';
import { SYSTEM_USER_ID } from '@/lib/core/constants';

import { addHistoryEntry } from '@/lib/utils/history-utils';

async function executeTaskAssignAction(task: Task, automation: Automation) {
    if (!automation.action.params.assigneeId) return;

    const taskRef = doc(db, 'tasks', task.id);
    const newAssigneeId = automation.action.params.assigneeId;

    await updateDoc(taskRef, {
        assigneeIds: arrayUnion(newAssigneeId),
        history: arrayUnion(addHistoryEntry(SYSTEM_USER_ID, 'Taak toegewezen via automatisering', `"${automation.name}"`))
    });
    
    await createNotification(
        newAssigneeId,
        `Je bent automatisch toegewezen aan taak: "${task.title}" via automatisering "${automation.name}"`,
        task.id,
        task.organizationId,
        SYSTEM_USER_ID,
        { eventType: 'automation' }
    );
}

async function executeSetPriorityAction(task: Task, automation: Automation) {
    if (!automation.action.params.priority) return;

    const taskRef = doc(db, 'tasks', task.id);
    const newPriority = automation.action.params.priority as Priority;

    await updateDoc(taskRef, {
        priority: newPriority,
        history: arrayUnion(addHistoryEntry(SYSTEM_USER_ID, 'Prioriteit ingesteld via automatisering', `"${automation.name}"`))
    });
}

async function executeAddLabelAction(task: Task, automation: Automation) {
    if (!automation.action.params.label) return;

    const taskRef = doc(db, 'tasks', task.id);
    const newLabel = automation.action.params.label as Label;

    if (task.labels.includes(newLabel)) return; // Don't add if it already exists

    await updateDoc(taskRef, {
        labels: arrayUnion(newLabel),
        history: arrayUnion(addHistoryEntry(SYSTEM_USER_ID, 'Label toegevoegd via automatisering', `"${automation.name}"`))
    });
}

async function executeAddCommentAction(task: Task, automation: Automation) {
    if (!automation.action.params.commentText) return;

    const taskRef = doc(db, 'tasks', task.id);
    const newComment: Omit<Comment, 'id'> = {
        userId: SYSTEM_USER_ID, // Comments from automations are from the system
        text: automation.action.params.commentText,
        createdAt: new Date(),
        readBy: [],
    };
    const historyEntry = addHistoryEntry(SYSTEM_USER_ID, 'Reactie toegevoegd via automatisering', `"${automation.action.params.commentText}"`);

    await updateDoc(taskRef, {
        comments: arrayUnion({ ...newComment, id: crypto.randomUUID() }),
        history: arrayUnion(historyEntry)
    });

    // Notify relevant people
    const recipients = new Set([...task.assigneeIds, task.creatorId]);
    recipients.forEach(recipientId => {
      if (recipientId) {
        createNotification(
            recipientId,
            `Automatisering "${automation.name}" heeft een reactie geplaatst op: "${task.title}"`,
            task.id,
            task.organizationId,
            SYSTEM_USER_ID,
            { eventType: 'automation' }
        );
      }
    });
}

export async function processTriggers(event: 'task.created' | 'task.updated', data: { task: Task, oldTask?: Task }) {
    const { task, oldTask } = data;
    const { organizationId } = task;

    // Fetch all enabled automations for this organization
    const automationsQuery = query(
        collection(db, 'automations'),
        where('organizationId', '==', organizationId),
        where('enabled', '==', true)
    );
    const snapshot = await getDocs(automationsQuery);
    if (snapshot.empty) return;

    const automations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Automation));

    for (const automation of automations) {
        let triggerFired = false;
        
        // Check if this automation's trigger matches the event
        switch(automation.trigger.type) {
            case 'task.created':
                if (event === 'task.created') {
                    const filters = automation.trigger.filters;
                    let filtersMatch = true;
                    if (filters) {
                        if (filters.priority && filters.priority !== task.priority) filtersMatch = false;
                        if (filters.label && !task.labels.includes(filters.label)) filtersMatch = false;
                    }
                    if (filtersMatch) triggerFired = true;
                }
                break;
            case 'task.status.changed':
                if (event === 'task.updated' && oldTask && task.status !== oldTask.status) {
                    const filters = automation.trigger.filters;
                    // If a status filter is set, it must match the new status
                    if (!filters?.status || filters.status === task.status) {
                        triggerFired = true;
                    }
                }
                break;
            case 'task.priority.changed':
                if (event === 'task.updated' && oldTask && task.priority !== oldTask.priority) {
                     const filters = automation.trigger.filters;
                    // If a priority filter is set, it must match the new priority
                    if (!filters?.priority || filters.priority === task.priority) {
                        triggerFired = true;
                    }
                }
                break;
            case 'task.label.added':
                if (event === 'task.updated' && oldTask) {
                    const addedLabels = task.labels.filter(l => !oldTask.labels.includes(l));
                    const filterLabel = automation.trigger.filters?.label;
                    if (addedLabels.length > 0 && (!filterLabel || addedLabels.includes(filterLabel))) {
                        triggerFired = true;
                    }
                }
                break;
        }
        
        if (triggerFired) {
            // Execute action
            switch (automation.action.type) {
                case 'task.assign':
                    await executeTaskAssignAction(task, automation);
                    break;
                case 'task.set.priority':
                    await executeSetPriorityAction(task, automation);
                    break;
                case 'task.add.label':
                    await executeAddLabelAction(task, automation);
                    break;
                case 'task.add.comment':
                    await executeAddCommentAction(task, automation);
                    break;
                default:
                    console.warn(`Unknown automation action type: ${automation.action.type}`);
            }
        }
    }
}
