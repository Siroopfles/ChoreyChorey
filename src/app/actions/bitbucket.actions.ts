
'use server';

import { searchBitbucketIssues, getBitbucketItem } from '@/lib/bitbucket-service';
import { getGitProviderConfig } from '@/lib/integration-helper';
import type { Organization } from '@/lib/types';

export async function searchBitbucketItems(organizationId: string, repo: string, query: string) {
    try {
        const config = await getGitProviderConfig(organizationId, 'bitbucket');
        const results = await searchBitbucketIssues(config.workspace, repo, query);
        return { items: results };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getBitbucketItemFromUrl(organizationId: string, url: string) {
    try {
        const config = await getGitProviderConfig(organizationId, 'bitbucket');
        const urlParts = url.match(/bitbucket\.org\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
        if (!urlParts) {
            return { error: 'Invalid Bitbucket URL format.' };
        }
        const [, workspace, repo, issueId] = urlParts;

        if (workspace.toLowerCase() !== config.workspace.toLowerCase() || !config.repos.some(r => r.toLowerCase() === repo.toLowerCase())) {
            return { error: `Repository ${workspace}/${repo} is not configured for this organization.` };
        }

        const item = await getBitbucketItem(workspace, repo, issueId);
        return { item };
    } catch (e: any) {
        return { error: e.message };
    }
}
