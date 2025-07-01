'use server';

import { searchBitbucketIssues, getBitbucketItem } from '@/lib/integrations/bitbucket-service';
import { getGitProviderConfig } from '@/lib/integrations/integration-helper';
import type { BitbucketLink } from '@/lib/types';

export async function searchBitbucketItems(organizationId: string, repo: string, query: string): Promise<{ data: { items: BitbucketLink[] } | null; error: string | null; }> {
    try {
        const config = await getGitProviderConfig(organizationId, 'bitbucket');
        const results = await searchBitbucketIssues(config.workspace, repo, query);
        return { data: { items: results }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getBitbucketItemFromUrl(organizationId: string, url: string): Promise<{ data: { item: BitbucketLink } | null; error: string | null; }> {
    try {
        const config = await getGitProviderConfig(organizationId, 'bitbucket');
        const urlParts = url.match(/bitbucket\.org\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
        if (!urlParts) {
            return { data: null, error: 'Invalid Bitbucket URL format.' };
        }
        const [, workspace, repo, issueId] = urlParts;

        if (workspace.toLowerCase() !== config.workspace.toLowerCase() || !config.repos.some(r => r.toLowerCase() === repo.toLowerCase())) {
            return { data: null, error: `Repository ${workspace}/${repo} is not configured for this organization.` };
        }

        const item = await getBitbucketItem(workspace, repo, issueId);
        return { data: { item }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}
