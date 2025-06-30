
'use server';

import type { BitbucketLink } from '@/lib/types';
import { env } from '@/lib/core/env';

const bitbucketApiBase = 'https://api.bitbucket.org/2.0';

async function fetchBitbucket(path: string, options: RequestInit = {}) {
    const username = env.BITBUCKET_USERNAME;
    const appPassword = env.BITBUCKET_APP_PASSWORD;

    if (!username || !appPassword) {
        throw new Error('Bitbucket credentials (BITBUCKET_USERNAME, BITBUCKET_APP_PASSWORD) are not configured in environment variables.');
    }

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Basic ${btoa(`${username}:${appPassword}`)}`);

    const response = await fetch(`${bitbucketApiBase}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Bitbucket API Error (${path}): ${response.status} ${errorText}`);
        throw new Error(`Bitbucket API request failed: ${errorText}`);
    }
    return response.json();
}

export async function searchBitbucketIssues(workspace: string, repoSlug: string, query: string): Promise<BitbucketLink[]> {
    const q = `title ~ "${query.replace(/"/g, '\\"')}"`;
    const response = await fetchBitbucket(`/repositories/${workspace}/${repoSlug}/issues?q=${encodeURIComponent(q)}`);
    
    return (response.values || []).map((item: any) => ({
        url: item.links.html.href,
        id: item.id.toString(),
        title: item.title,
        state: item.state,
        type: 'issue',
    }));
}

export async function getBitbucketItem(workspace: string, repoSlug: string, issueId: string): Promise<BitbucketLink> {
    const item = await fetchBitbucket(`/repositories/${workspace}/${repoSlug}/issues/${issueId}`);
    return {
        url: item.links.html.href,
        id: item.id.toString(),
        title: item.title,
        state: item.state,
        type: 'issue',
    };
}
