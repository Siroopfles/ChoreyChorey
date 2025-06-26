
'use server';

import { db } from '@/lib/firebase';
import { collection, writeBatch, doc, getDocs, query, where } from 'firebase/firestore';
import type { User } from '@/lib/types';
import Papa from 'papaparse';


export async function handleImportTasks(csvContent: string, mapping: Record<string, string>, organizationId: string, creatorId: string) {
    let successCount = 0;
    let errorCount = 0;

    try {
        const { data: rows } = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
        
        const invertedMapping = Object.entries(mapping).reduce((acc, [key, value]) => {
            if (value !== 'ignore') {
                acc[value] = key;
            }
            return acc;
        }, {} as Record<string, string>);

        if (!invertedMapping.title) {
            return { error: 'Het "title" veld moet gekoppeld zijn.' };
        }

        const batch = writeBatch(db);
        const allUserEmails = Array.from(new Set(rows.map((row: any) => row[invertedMapping.assigneeEmail]).filter(Boolean)));
        
        const usersByEmail: Record<string, User> = {};
        if (allUserEmails.length > 0) {
            const usersQuery = query(collection(db, 'users'), where('email', 'in', allUserEmails), where('organizationIds', 'array-contains', organizationId));
            const usersSnapshot = await getDocs(usersQuery);
            usersSnapshot.forEach(doc => {
                const user = { id: doc.id, ...doc.data() } as User;
                usersByEmail[user.email] = user;
            });
        }
        
        for (const row of rows as any[]) {
            const title = row[invertedMapping.title];
            if (!title) {
                errorCount++;
                continue;
            }

            const assigneeEmail = row[invertedMapping.assigneeEmail];
            const assignee = assigneeEmail ? usersByEmail[assigneeEmail] : null;

            const taskData: any = {
                title,
                description: row[invertedMapping.description] || '',
                priority: row[invertedMapping.priority] || 'Midden',
                status: row[invertedMapping.status] || 'Te Doen',
                dueDate: row[invertedMapping.dueDate] ? new Date(row[invertedMapping.dueDate]) : null,
                labels: row[invertedMapping.labels] ? row[invertedMapping.labels].split(',').map((l:string) => l.trim()) : [],
                assigneeId: assignee ? assignee.id : null,
                creatorId,
                organizationId,
                createdAt: new Date(),
                order: Date.now() + successCount,
                history: [{
                    id: crypto.randomUUID(),
                    userId: creatorId,
                    timestamp: new Date(),
                    action: 'Aangemaakt',
                    details: 'Via CSV import',
                }],
                // other fields to default
                subtasks: [],
                attachments: [],
                comments: [],
                isPrivate: false,
                thanked: false,
                completedAt: null,
                storyPoints: null,
                teamId: null,
                timeLogged: 0,
                activeTimerStartedAt: null,
            };

            const taskRef = doc(collection(db, 'tasks'));
            batch.set(taskRef, taskData);
            successCount++;
        }

        await batch.commit();
        
        return { successCount, errorCount };

    } catch (e: any) {
        return { error: e.message, successCount, errorCount };
    }
}
