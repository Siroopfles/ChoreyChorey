
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, updateDoc, doc, writeBatch, addDoc, arrayUnion, arrayRemove, runTransaction, getDoc, setDoc, deleteDoc, deleteField } from 'firebase/firestore';
import type { User, Organization, Invite, Task, TaskTemplate, RoleName } from '@/lib/types';
import { suggestTaskAssignee } from '@/ai/flows/suggest-task-assignee';
import { suggestSubtasks } from '@/ai/flows/suggest-subtasks';
import { processCommand } from '@/ai/flows/process-command';
import { summarizeComments } from '@/ai/flows/summarize-comments';
import { suggestStoryPoints } from '@/ai/flows/suggest-story-points';
import { generateAvatar } from '@/ai/flows/generate-avatar-flow';
import { generateTaskImage } from '@/ai/flows/generate-task-image-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { multiSpeakerTextToSpeech } from '@/ai/flows/multi-speaker-tts-flow';
import type { MultiSpeakerTextToSpeechInput, ProcessCommandInput } from '@/ai/schemas';
import { auth } from '@/lib/firebase';
import Papa from 'papaparse';

const getTaskHistory = async (organizationId: string) => {
    const tasksQuery = query(collection(db, 'tasks'), where('organizationId', '==', organizationId), where('status', '==', 'Voltooid'));
    const usersQuery = query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId));

    const [tasksSnapshot, usersSnapshot] = await Promise.all([
        getDocs(tasksQuery),
        getDocs(usersQuery)
    ]);

    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    const userMap = new Map(users.map(u => [u.id, u]));

    return tasksSnapshot.docs.map(doc => {
        const task = doc.data();
        const assignee = task.assigneeId ? userMap.get(task.assigneeId) : null;
        const completedAt = (task.completedAt as Timestamp)?.toDate();
        const createdAt = (task.createdAt as Timestamp)?.toDate();

        return {
            assignee: assignee?.name || 'Unknown',
            taskDescription: task.description,
            completionTime: (completedAt && createdAt) ? (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60) : 0, // in hours
        };
    }).filter(th => th.completionTime > 0);
};

export async function updateUserProfile(userId: string, data: Partial<Pick<User, 'name' | 'avatar' | 'skills'>>) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, data);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return { error: error.message };
    }
}

export async function handleSuggestAssignee(taskDescription: string, organizationId: string) {
    try {
        const orgUsersSnapshot = await getDocs(query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId)));
        const orgUsers = orgUsersSnapshot.docs.map(doc => doc.data() as User);

        if (orgUsers.length === 0) {
            return { suggestion: { suggestedAssignee: 'Niemand', reasoning: 'Er zijn geen gebruikers in deze organisatie om aan toe te wijzen.' } };
        }

        const assigneeSkills = orgUsers.reduce((acc, user) => {
            acc[user.name] = user.skills || [];
            return acc;
        }, {} as Record<string, string[]>);
        
        const taskHistory = await getTaskHistory(organizationId);
        const suggestion = await suggestTaskAssignee({ taskDescription, assigneeSkills, taskHistory });
        return { suggestion };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleSuggestSubtasks(title: string, description?: string) {
    try {
        const result = await suggestSubtasks({ title, description });
        return { subtasks: result.subtasks };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleProcessCommand(command: string, userId: string, organizationId: string, userName: string) {
    try {
        const result = await processCommand({ command, userId, organizationId, userName });
        return { result };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleSummarizeComments(comments: string[]) {
    try {
        const result = await summarizeComments({ comments });
        return { summary: result.summary };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleSuggestStoryPoints(title: string, description?: string) {
    try {
        const suggestion = await suggestStoryPoints({ title, description });
        return { suggestion };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleGenerateAvatar(name: string) {
    try {
        const result = await generateAvatar(name);
        return { avatarDataUri: result.avatarDataUri };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleGenerateTaskImage(input: { title: string, description?: string }) {
    try {
        const result = await generateTaskImage(input);
        return { imageDataUri: result.imageDataUri };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleTextToSpeech(text: string) {
    try {
        const result = await textToSpeech(text);
        return { audioDataUri: result.audioDataUri };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleMultiSpeakerTextToSpeech(input: MultiSpeakerTextToSpeechInput) {
    try {
        const result = await multiSpeakerTextToSpeech(input);
        return { audioDataUri: result.audioDataUri };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function createOrganizationInvite(organizationId: string, inviterId: string) {
    try {
        const newInviteRef = doc(collection(db, 'invites'));
        const newInvite: Omit<Invite, 'id'> = {
            organizationId,
            inviterId,
            status: 'pending',
            createdAt: new Date(),
        };
        await setDoc(newInviteRef, newInvite);
        return { success: true, inviteId: newInviteRef.id };
    } catch (error: any) {
        console.error("Error creating invite:", error);
        return { error: error.message };
    }
}

export async function getInviteDetails(inviteId: string) {
    try {
        const inviteRef = doc(db, 'invites', inviteId);
        const inviteDoc = await getDoc(inviteRef);

        if (!inviteDoc.exists() || inviteDoc.data().status !== 'pending') {
            return { error: 'Uitnodiging is ongeldig of al gebruikt.' };
        }
        
        const organizationRef = doc(db, 'organizations', inviteDoc.data().organizationId);
        const organizationDoc = await getDoc(organizationRef);
        
        if (!organizationDoc.exists()) {
             return { error: 'De organisatie voor deze uitnodiging bestaat niet meer.' };
        }

        return {
            success: true,
            invite: { id: inviteDoc.id, ...inviteDoc.data() } as Invite,
            organization: { id: organizationDoc.id, ...organizationDoc.data() } as Organization,
        };

    } catch(e: any) {
        return { error: e.message };
    }
}

export async function acceptOrganizationInvite(inviteId: string, userId: string) {
     try {
        await runTransaction(db, async (transaction) => {
            const inviteRef = doc(db, 'invites', inviteId);
            const userRef = doc(db, 'users', userId);

            const inviteDoc = await transaction.get(inviteRef);
            if (!inviteDoc.exists() || inviteDoc.data().status !== 'pending') {
                throw new Error("Uitnodiging is ongeldig of al gebruikt.");
            }

            const organizationId = inviteDoc.data().organizationId;
            const organizationRef = doc(db, 'organizations', organizationId);
            const memberPath = `members.${userId}`;

            transaction.update(userRef, {
                organizationIds: arrayUnion(organizationId),
                currentOrganizationId: organizationId,
            });
            
            transaction.update(organizationRef, {
                [memberPath]: { role: 'Member' }
            });

            transaction.update(inviteRef, {
                status: 'accepted'
            });
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error accepting invite:", error);
        return { error: error.message };
    }
}

export async function updateUserRoleInOrganization(organizationId: string, targetUserId: string, newRole: RoleName, currentUserId: string) {
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const orgDoc = await getDoc(orgRef);
        if (!orgDoc.exists()) throw new Error("Organisatie niet gevonden.");
        
        const orgData = orgDoc.data() as Organization;
        const currentUserRole = orgData.members[currentUserId]?.role;

        if (currentUserRole !== 'Owner' && currentUserRole !== 'Admin') {
            throw new Error("Je hebt geen permissie om rollen aan te passen.");
        }
        if (orgData.ownerId === targetUserId) {
            throw new Error("De rol van de eigenaar kan niet worden gewijzigd.");
        }
        if (orgData.ownerId === currentUserId && newRole !== 'Owner' && targetUserId === currentUserId) {
             throw new Error("De eigenaar kan zijn eigen rol niet verlagen.");
        }

        const memberPath = `members.${targetUserId}.role`;
        await updateDoc(orgRef, { [memberPath]: newRole });

        return { success: true };

    } catch (error: any) {
        console.error("Error updating user role:", error);
        return { error: error.message };
    }
}

export async function updateOrganization(organizationId: string, userId: string, data: Partial<Pick<Organization, 'name'>>) {
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const orgDoc = await getDoc(orgRef);

        if (!orgDoc.exists() || orgDoc.data().ownerId !== userId) {
            throw new Error("Alleen de eigenaar kan deze organisatie bijwerken.");
        }

        await updateDoc(orgRef, data);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating organization:", error);
        return { error: error.message };
    }
}

export async function leaveOrganization(organizationId: string, userId: string) {
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const orgDoc = await getDoc(orgRef);

        if (!orgDoc.exists()) {
            throw new Error("Organisatie niet gevonden.");
        }
        if (orgDoc.data().ownerId === userId) {
            throw new Error("De eigenaar kan de organisatie niet verlaten. Verwijder de organisatie of draag het eigendom over.");
        }

        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
             throw new Error("Gebruiker niet gevonden.");
        }

        const userData = userDoc.data() as User;
        const newOrgIds = userData.organizationIds?.filter(id => id !== organizationId) || [];
        
        const userUpdateData: any = {
             organizationIds: arrayRemove(organizationId)
        };

        if (userData.currentOrganizationId === organizationId) {
            userUpdateData.currentOrganizationId = newOrgIds.length > 0 ? newOrgIds[0] : null;
        }
        
        const memberPath = `members.${userId}`;
        const orgUpdateData = { [memberPath]: deleteField() };

        await updateDoc(userRef, userUpdateData);
        await updateDoc(orgRef, orgUpdateData);

        return { success: true };
    } catch (error: any) {
        console.error("Error leaving organization:", error);
        return { error: error.message };
    }
}

export async function deleteOrganization(organizationId: string, userId: string) {
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const orgDoc = await getDoc(orgRef);

        if (!orgDoc.exists() || orgDoc.data().ownerId !== userId) {
            throw new Error("Alleen de eigenaar kan deze organisatie verwijderen.");
        }

        const batch = writeBatch(db);

        // Delete associated collections
        const collectionsToDelete = ['teams', 'tasks', 'taskTemplates', 'invites'];
        for (const coll of collectionsToDelete) {
            const q = query(collection(db, coll), where('organizationId', '==', organizationId));
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => batch.delete(doc.ref));
        }

        // Update users who are members
        const usersQuery = query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId));
        const usersSnapshot = await getDocs(usersQuery);
        
        usersSnapshot.forEach(userDoc => {
            const userData = userDoc.data() as User;
            const newOrgIds = userData.organizationIds?.filter(id => id !== organizationId) || [];
            const updateData: any = { organizationIds: arrayRemove(organizationId) };
            if (userData.currentOrganizationId === organizationId) {
                updateData.currentOrganizationId = newOrgIds.length > 0 ? newOrgIds[0] : null;
            }
            batch.update(userDoc.ref, updateData);
        });

        // Delete the organization itself
        batch.delete(orgRef);
        
        await batch.commit();

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting organization:", error);
        return { error: error.message };
    }
}

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

            const taskData = {
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
