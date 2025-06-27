'use server';

import { getIssueOrPr, searchIssuesAndPRs } from '@/lib/github-service';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Organization } from '@/lib/types';

async function getGitHubConfig(organizationId: string) {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) {
        throw new Error('Organization not found');
    }
    const orgData = orgDoc.data() as Organization;
    const githubConfig = orgData.settings?.github;
    if (!githubConfig || !githubConfig.owner || !githubConfig.repos || githubConfig.repos.length === 0) {
        throw new Error('GitHub integration is not configured for this organization.');
    }
    return githubConfig;
}


export async function searchGithubItems(organizationId: string, repo: string, query: string) {
    try {
        const config = await getGitHubConfig(organizationId);
        return await searchIssuesAndPRs(config.owner, repo, query);
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getGithubItemFromUrl(organizationId: string, url: string) {
     try {
        const config = await getGitHubConfig(organizationId);
        const urlParts = url.match(/github\.com\/([^/]+)\/([^/]+)\/(issues|pull)\/(\d+)/);
        if (!urlParts) {
            return { error: 'Invalid GitHub URL format.' };
        }
        const [, owner, repo, , itemNumber] = urlParts;

        if (owner.toLowerCase() !== config.owner.toLowerCase() || !config.repos.some(r => r.toLowerCase() === repo.toLowerCase())) {
            return { error: `Repository ${owner}/${repo} is not configured for this organization.` };
        }

        const item = await getIssueOrPr(owner, repo, parseInt(itemNumber, 10));
        return { item };
    } catch (e: any) {
        return { error: e.message };
    }
}
