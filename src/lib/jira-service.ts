
'use server';

import type { JiraLink } from './types';

const baseUrl = process.env.JIRA_BASE_URL;
const email = process.env.JIRA_USER_EMAIL;
const apiToken = process.env.JIRA_API_TOKEN;

async function fetchJira(path: string, options: RequestInit = {}) {
    if (!baseUrl || !email || !apiToken) {
        throw new Error('Jira environment variables are not configured.');
    }

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Basic ${btoa(`${email}:${apiToken}`)}`);

    const response = await fetch(`${baseUrl}/rest/api/3/${path}`, {
        ...options,
        headers,
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Jira API Error (${path}): ${response.status} ${errorText}`);
        throw new Error(`Jira API request failed: ${errorText}`);
    }

    return response.json();
}

export async function getJiraIssue(issueKey: string): Promise<JiraLink> {
    try {
        const response = await fetchJira(`issue/${issueKey}`);
        
        return {
            key: response.key,
            url: `${baseUrl}/browse/${response.key}`,
            summary: response.fields.summary,
            status: response.fields.status.name,
            iconUrl: response.fields.issuetype.iconUrl,
        };
    } catch (error) {
        console.error('Jira API get issue error:', error);
        throw new Error('Failed to get Jira issue.');
    }
}
