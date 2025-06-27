
'use server';

import type { Task } from './types';

const togglApiBase = 'https://api.track.toggl.com/api/v9';

async function fetchToggl(apiToken: string, path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', 'Basic ' + btoa(`${apiToken}:api_token`));

    const response = await fetch(`${togglApiBase}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Toggl API Error (${path}): ${response.status} ${errorText}`);
        throw new Error(`Toggl API request failed: ${errorText}`);
    }

    // Toggl can return 200 OK with an empty body for some requests
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return null;
}

export async function getTogglWorkspaces(apiToken: string) {
    return fetchToggl(apiToken, '/me/workspaces');
}

export async function getTogglProjects(apiToken: string, workspaceId: number) {
    return fetchToggl(apiToken, `/workspaces/${workspaceId}/projects`);
}

export async function createTogglTimeEntry(
    apiToken: string,
    workspaceId: number,
    task: Task,
    duration: number, // in seconds
    start: Date
) {
    const body = {
        description: task.title,
        workspace_id: workspaceId,
        project_id: task.togglProjectId,
        duration,
        start: start.toISOString(),
        created_with: 'Chorey',
        stop: new Date().toISOString(),
    };

    return fetchToggl(apiToken, `/workspaces/${workspaceId}/time_entries`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
