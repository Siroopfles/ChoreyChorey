
'use server';
import { getClockifyWorkspaces as getWorkspaces, getClockifyProjects as getProjects } from '@/lib/integrations/clockify-service';
import { getApiToken } from '@/lib/utils/user-helpers';

export async function getClockifyWorkspaces(userId: string): Promise<{ data: { workspaces: any[] } | null; error: string | null; }> {
    const apiToken = await getApiToken(userId, 'clockifyApiToken');
    if (!apiToken) {
        return { data: null, error: 'Clockify API token not set.' };
    }
    try {
        const workspaces = await getWorkspaces(apiToken);
        return { data: { workspaces }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getClockifyProjects(userId: string, workspaceId: string): Promise<{ data: { projects: any[] } | null; error: string | null; }> {
    const apiToken = await getApiToken(userId, 'clockifyApiToken');
    if (!apiToken) {
        return { data: null, error: 'Clockify API token not set.' };
    }
     try {
        const projects = await getProjects(apiToken, workspaceId);
        return { data: { projects }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}
