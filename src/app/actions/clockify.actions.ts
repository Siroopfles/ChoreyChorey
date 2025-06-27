
'use server';
import { getClockifyWorkspaces as getWorkspaces, getClockifyProjects as getProjects } from '@/lib/clockify-service';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function getApiToken(userId: string): Promise<string | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data().clockifyApiToken || null : null;
}

export async function getClockifyWorkspaces(userId: string) {
    const apiToken = await getApiToken(userId);
    if (!apiToken) {
        return { error: 'Clockify API token not set.' };
    }
    try {
        const workspaces = await getWorkspaces(apiToken);
        return { workspaces };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getClockifyProjects(userId: string, workspaceId: string) {
    const apiToken = await getApiToken(userId);
    if (!apiToken) {
        return { error: 'Clockify API token not set.' };
    }
     try {
        const projects = await getProjects(apiToken, workspaceId);
        return { projects };
    } catch (e: any) {
        return { error: e.message };
    }
}
