'use server';
import type { GitLabLink } from './types';

const gitlabApiBase = 'https://gitlab.com/api/v4';

async function fetchGitLab(path: string, options: RequestInit = {}) {
    const token = process.env.GITLAB_TOKEN;
    if (!token) {
        throw new Error('GitLab token (GITLAB_TOKEN) is not configured in environment variables.');
    }

    const headers = new Headers(options.headers);
    headers.set('PRIVATE-TOKEN', token);

    const response = await fetch(`${gitlabApiBase}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`GitLab API Error (${path}): ${response.status} ${errorText}`);
        throw new Error(`GitLab API request failed: ${errorText}`);
    }
    return response.json();
}

async function getProjectId(projectPath: string): Promise<string> {
    const projects = await fetchGitLab(`/projects?search=${encodeURIComponent(projectPath)}&simple=true`);
    const project = projects.find((p: any) => p.path_with_namespace === projectPath);
    if (!project) throw new Error(`GitLab project '${projectPath}' not found or token lacks permission.`);
    return project.id;
}

export async function searchGitLab(projectPath: string, query: string): Promise<GitLabLink[]> {
    const projectId = await getProjectId(projectPath);
    const [issues, mrs] = await Promise.all([
        fetchGitLab(`/projects/${projectId}/issues?search=${encodeURIComponent(query)}`),
        fetchGitLab(`/projects/${projectId}/merge_requests?search=${encodeURIComponent(query)}`)
    ]);

    const formattedIssues: GitLabLink[] = issues.map((item: any) => ({
        url: item.web_url,
        iid: item.iid,
        title: item.title,
        state: item.state,
        type: 'issue',
    }));

    const formattedMrs: GitLabLink[] = mrs.map((item: any) => ({
        url: item.web_url,
        iid: item.iid,
        title: item.title,
        state: item.state,
        type: 'merge_request',
    }));

    return [...formattedIssues, ...formattedMrs];
}

export async function getGitLabItem(projectPath: string, itemIid: number, type: 'issue' | 'merge_request'): Promise<GitLabLink> {
     const projectId = await getProjectId(projectPath);
     const endpoint = type === 'issue' ? 'issues' : 'merge_requests';
     const item = await fetchGitLab(`/projects/${projectId}/${endpoint}/${itemIid}`);
     
     return {
        url: item.web_url,
        iid: item.iid,
        title: item.title,
        state: item.state,
        type: type,
     };
}
