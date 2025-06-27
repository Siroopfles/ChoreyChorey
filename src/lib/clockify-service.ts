
'use server';

import type { Task } from './types';

const clockifyApiBase = 'https://api.clockify.me/api/v1';

async function fetchClockify(apiKey: string, path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('X-Api-Key', apiKey);

    const response = await fetch(`${clockifyApiBase}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Clockify API Error (${path}): ${response.status} ${errorText}`);
        throw new Error(`Clockify API request failed: ${errorText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return null;
}

export async function getClockifyWorkspaces(apiKey: string) {
    return fetchClockify(apiKey, '/workspaces');
}

export async function getClockifyProjects(apiKey: string, workspaceId: string) {
    return fetchClockify(apiKey, `/workspaces/${workspaceId}/projects`);
}

export async function createClockifyTimeEntry(
    apiKey: string,
    workspaceId: string,
    task: Task,
    durationInSeconds: number, // Clockify uses start/end, so this is for reference
    start: Date
) {
    const body = {
        description: task.title,
        project_id: task.clockifyProjectId,
        start: start.toISOString(),
        end: new Date().toISOString(),
    };

    return fetchClockify(apiKey, `/workspaces/${workspaceId}/time-entries`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
