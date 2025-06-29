'use server';

import { searchGitLab, getGitLabItem } from '@/lib/gitlab-service';
import { getGitProviderConfig } from '@/lib/integration-helper';
import type { Organization } from '@/lib/types';

export async function searchGitLabItems(organizationId: string, projectPath: string, query: string) {
    try {
        await getGitProviderConfig(organizationId, 'gitlab'); // Just to check if configured
        const results = await searchGitLab(projectPath, query);
        return { items: results };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getGitLabItemFromUrl(organizationId: string, url: string) {
     try {
        const config = await getGitProviderConfig(organizationId, 'gitlab');
        const urlParts = url.match(/gitlab\.com\/([^/]+\/[^/]+)\/-\/(issues|merge_requests)\/(\d+)/);
        if (!urlParts) {
            return { error: 'Invalid GitLab URL format.' };
        }
        const [, projectPath, type, itemIid] = urlParts;

        if (!config.projects.some(p => p.toLowerCase() === projectPath.toLowerCase())) {
            return { error: `Project ${projectPath} is not configured for this organization.` };
        }

        const item = await getGitLabItem(projectPath, parseInt(itemIid, 10), type === 'issues' ? 'issue' : 'merge_request');
        return { item };
    } catch (e: any) {
        return { error: e.message };
    }
}
