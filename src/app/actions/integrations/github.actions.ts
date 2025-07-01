'use server';

import { getIssueOrPr, searchIssuesAndPRs, addComment, getComments } from '@/lib/integrations/github-service';
import { getGitProviderConfig } from '@/lib/integrations/integration-helper';

export async function searchGithubItems(organizationId: string, repo: string, query: string): Promise<{ data: any | null; error: string | null; }> {
    try {
        const config = await getGitProviderConfig(organizationId, 'github');
        const items = await searchIssuesAndPRs(config.owner, repo, query);
        return { data: { items }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getGithubItemFromUrl(organizationId: string, url: string): Promise<{ data: { item: any } | null; error: string | null; }> {
     try {
        const config = await getGitProviderConfig(organizationId, 'github');
        const urlParts = url.match(/github\.com\/([^/]+)\/([^/]+)\/(issues|pull)\/(\d+)/);
        if (!urlParts) {
            return { data: null, error: 'Invalid GitHub URL format.' };
        }
        const [, owner, repo, , itemNumber] = urlParts;

        if (owner.toLowerCase() !== config.owner.toLowerCase() || !config.repos.some(r => r.toLowerCase() === repo.toLowerCase())) {
            return { data: null, error: `Repository ${owner}/${repo} is not configured for this organization.` };
        }

        const item = await getIssueOrPr(owner, repo, parseInt(itemNumber, 10));
        return { data: { item }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function addCommentToGithubItem(owner: string, repo: string, itemNumber: number, commentBody: string, userName: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    try {
        const formattedBody = `*Reactie vanuit Chorey door ${userName}:*\n\n${commentBody}`;
        await addComment(owner, repo, itemNumber, formattedBody);
        return { data: { success: true }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getGithubComments(owner: string, repo: string, itemNumber: number): Promise<{ data: { comments: any[] } | null; error: string | null; }> {
    try {
        const comments = await getComments(owner, repo, itemNumber);
        return { data: { comments }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}
