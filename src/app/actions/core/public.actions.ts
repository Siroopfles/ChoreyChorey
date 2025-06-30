

'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import type { Task, User, Project, Organization, StatusDefinition } from '@/lib/types';

export async function getPublicProjectData(projectId: string): Promise<{ data: { project: Project, tasks: Task[], users: Pick<User, 'id' | 'name' | 'avatar'>[], statuses: StatusDefinition[] } | null; error: string | null; }> {
    try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            return { data: null, error: 'Project niet gevonden.' };
        }
        
        const project = { id: projectDoc.id, ...projectDoc.data() } as Project;

        const orgRef = doc(db, 'organizations', project.organizationId);
        const orgDoc = await getDoc(orgRef);
        if (!orgDoc.exists() || orgDoc.data().settings?.features?.publicSharing === false) {
            return { data: null, error: 'Publiek delen is uitgeschakeld voor deze organisatie.' };
        }
        
        const orgData = orgDoc.data() as Organization;
        const statuses = orgData.settings?.customization?.statuses || [];

        if (!project.isPublic) {
            return { data: null, error: 'Dit project is niet openbaar.' };
        }
        
        // Fetch tasks for the public project, excluding private/sensitive ones
        const tasksQuery = query(
            collection(db, 'tasks'), 
            where('projectId', '==', projectId),
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
            if (task.creatorId) userIds.add(task.creatorId);
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
        
        return { data: { project, tasks, users, statuses }, error: null };

    } catch (e: any) {
        console.error("Error fetching public project data:", e);
        return { data: null, error: 'Er is een onbekende fout opgetreden.' };
    }
}
