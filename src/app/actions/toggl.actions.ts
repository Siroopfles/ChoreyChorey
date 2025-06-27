
'use server';
import { getTogglWorkspaces as getWorkspaces, getTogglProjects as getProjects } from '@/lib/toggl-service';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function getApiToken(userId: string): Promise<string | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data().togglApiToken || null : null;
}

export async function getTogglWorkspaces(userId: string) {
    const apiToken = await getApiToken(userId);
    if (!apiToken) {
        return { error: 'Toggl API token not set.' };
    }
    try {
        const workspaces = await getWorkspaces(apiToken);
        return { workspaces };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getTogglProjects(userId: string, workspaceId: number) {
    const apiToken = await getApiToken(userId);
    if (!apiToken) {
        return { error: 'Toggl API token not set.' };
    }
     try {
        const projects = await getProjects(apiToken, workspaceId);
        return { projects };
    } catch (e: any) {
        return { error: e.message };
    }
}
