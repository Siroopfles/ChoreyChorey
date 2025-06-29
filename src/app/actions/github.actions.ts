
'use server';

import { getIssueOrPr, searchIssuesAndPRs, addComment, getComments } from '@/lib/github-service';
import { getGitProviderConfig } from '@/lib/integration-helper';
import type { Organization } from '@/lib/types';

export async function searchGithubItems(organizationId: string, repo: string, query: string) {
    try {
        const config = await getGitProviderConfig(organizationId, 'github');
        return await searchIssuesAndPRs(config.owner, repo, query);
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getGithubItemFromUrl(organizationId: string, url: string) {
     try {
        const config = await getGitProviderConfig(organizationId, 'github');
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

export async function addCommentToGithubItem(owner: string, repo: string, itemNumber: number, commentBody: string, userName: string) {
    try {
        const formattedBody = `*Reactie vanuit Chorey door ${userName}:*\n\n${commentBody}`;
        await addComment(owner, repo, itemNumber, formattedBody);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getGithubComments(owner: string, repo: string, itemNumber: number) {
    try {
        const comments = await getComments(owner, repo, itemNumber);
        return { comments };
    } catch (e: any) {
        return { error: e.message };
    }
}
