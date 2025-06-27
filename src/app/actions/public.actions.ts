
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import type { Task, User, Team } from '@/lib/types';

export async function getPublicTeamData(teamId: string): Promise<{ team: Team, tasks: Task[], users: Pick<User, 'id' | 'name' | 'avatar'>[] } | { error: string }> {
    try {
        const teamRef = doc(db, 'teams', teamId);
        const teamDoc = await getDoc(teamRef);

        if (!teamDoc.exists()) {
            return { error: 'Team niet gevonden.' };
        }
        
        const team = { id: teamDoc.id, ...teamDoc.data() } as Team;

        if (!team.isPublic) {
            return { error: 'Dit team is niet openbaar.' };
        }
        
        // Fetch tasks for the public team, excluding private/sensitive ones
        const tasksQuery = query(
            collection(db, 'tasks'), 
            where('teamId', '==', teamId),
            where('isPrivate', '==', false),
            where('isSensitive', '==', false)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasks = tasksSnapshot.docs.map(d => {
            const data = d.data();
            return { id: d.id, ...data, createdAt: (data.createdAt as any).toDate(), dueDate: (data.dueDate as any)?.toDate() } as Task;
        });

        // Get all unique user IDs from the tasks
        const userIds = new Set<string>();
        tasks.forEach(task => {
            task.assigneeIds.forEach(id => userIds.add(id));
        });

        const users: Pick<User, 'id' | 'name' | 'avatar'>[] = [];
        if (userIds.size > 0) {
            const usersQuery = query(collection(db, 'users'), where('__name__', 'in', Array.from(userIds)));
            const usersSnapshot = await getDocs(usersQuery);
            usersSnapshot.forEach(userDoc => {
                const userData = userDoc.data();
                users.push({
                    id: userDoc.id,
                    name: userData.name,
                    avatar: userData.avatar,
                });
            });
        }
        
        return { team, tasks, users };

    } catch (e: any) {
        console.error("Error fetching public team data:", e);
        return { error: 'Er is een onbekende fout opgetreden.' };
    }
}
