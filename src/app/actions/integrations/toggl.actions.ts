
'use server';
import { getTogglWorkspaces as getWorkspaces, getTogglProjects as getProjects } from '@/lib/toggl-service';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function getApiToken(userId: string): Promise<string | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data().togglApiToken || null : null;
}

export async function getTogglWorkspaces(userId: string): Promise<{ data: { workspaces: any[] } | null; error: string | null; }> {
    const apiToken = await getApiToken(userId);
    if (!apiToken) {
        return { data: null, error: 'Toggl API token not set.' };
    }
    try {
        const workspaces = await getWorkspaces(apiToken);
        return { data: { workspaces }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getTogglProjects(userId: string, workspaceId: number): Promise<{ data: { projects: any[] } | null; error: string | null; }> {
    const apiToken = await getApiToken(userId);
    if (!apiToken) {
        return { data: null, error: 'Toggl API token not set.' };
    }
     try {
        const projects = await getProjects(apiToken, workspaceId);
        return { data: { projects }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}
