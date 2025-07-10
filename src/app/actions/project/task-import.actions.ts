
'use server';

import Papa from 'papaparse';
import { db } from '@/lib/core/firebase';
import { collection, writeBatch } from 'firebase/firestore';
import type { Task, Status } from '@/lib/types';
import { addHistoryEntry } from '@/lib/utils/history-utils';

type MappedTask = Partial<Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'dueDate'>> & {
    assigneeEmail?: string;
    labels?: string;
};

// This function was previously in task.actions.ts and is now isolated.
export async function handleImportTasks(
  csvContent: string,
  mapping: Record<string, string>,
  organizationId: string,
  creatorId: string
): Promise<{ data: { successCount: number, errorCount: number } | null; error: string | null; }> {
    try {
        const results = Papa.parse<Record<string, string>>(csvContent, {
            header: true,
            skipEmptyLines: true,
        });

        if (results.errors.length > 0) {
            console.error('CSV Parsing errors:', results.errors);
            return { data: null, error: `Fout bij parsen CSV: ${results.errors[0].message}` };
        }

        const batch = writeBatch(db);
        let successCount = 0;
        let errorCount = 0;

        for (const row of results.data) {
            try {
                const mappedTask: MappedTask = {};
                for (const csvHeader in mapping) {
                    const taskField = mapping[csvHeader];
                    if (taskField !== 'ignore' && row[csvHeader]) {
                        (mappedTask as any)[taskField] = row[csvHeader];
                    }
                }
                
                if (!mappedTask.title) {
                    errorCount++;
                    continue;
                }

                const firestoreTask: Omit<Task, 'id'> = {
                    title: mappedTask.title,
                    description: mappedTask.description || '',
                    status: (mappedTask.status as Status) || 'Te Doen',
                    priority: (mappedTask.priority as Task['priority']) || 'Midden',
                    dueDate: mappedTask.dueDate ? new Date(mappedTask.dueDate) : undefined,
                    labels: mappedTask.labels ? mappedTask.labels.split(',').map(l => l.trim()) : [],
                    assigneeIds: [], // Assignee logic would require an extra step to resolve email to ID
                    creatorId: creatorId,
                    organizationId: organizationId,
                    createdAt: new Date(),
                    order: Date.now(),
                    history: [addHistoryEntry(creatorId, 'Geïmporteerd via CSV')],
                    // Add defaults for all other required fields
                    subtasks: [],
                    attachments: [],
                    comments: [],
                    isPrivate: false,
                    isSensitive: false,
                    isBlocked: false,
                    completedAt: null,
                    storyPoints: null,
                    cost: null,
                    blockedBy: [],
                    relations: [],
                    recurring: null,
                    imageUrl: null,
                    thanked: false,
                    timeLogged: 0,
                    activeTimerStartedAt: null,
                    rating: null,
                    reviewerId: null,
                    consultedUserIds: [],
                    informedUserIds: [],
                    teamId: null,
                    isChoreOfTheWeek: false,
                    helpNeeded: false,
                };
                
                const taskRef = collection(db, 'tasks');
                batch.set(doc(taskRef), firestoreTask);
                successCount++;

            } catch (rowError) {
                console.error('Error processing row:', row, rowError);
                errorCount++;
            }
        }

        await batch.commit();
        return { data: { successCount, errorCount }, error: null };

    } catch (e: any) {
        console.error("Error handling task import:", e);
        return { data: null, error: 'Er is een algemene fout opgetreden bij het importeren.' };
    }
}
