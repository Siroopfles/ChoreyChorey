'use server';

import { searchGitLab, getGitLabItem } from '@/lib/gitlab-service';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Organization } from '@/lib/types';

async function getGitLabConfig(organizationId: string) {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) throw new Error('Organization not found');

    const orgData = orgDoc.data() as Organization;
    const gitlabConfig = orgData.settings?.gitlab;
    if (!gitlabConfig || !gitlabConfig.projects || gitlabConfig.projects.length === 0) {
        throw new Error('GitLab integration is not configured for this organization.');
    }
    return gitlabConfig;
}

export async function searchGitLabItems(organizationId: string, projectPath: string, query: string) {
    try {
        await getGitLabConfig(organizationId); // Just to check if configured
        const results = await searchGitLab(projectPath, query);
        return { items: results };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getGitLabItemFromUrl(organizationId: string, url: string) {
     try {
        const config = await getGitLabConfig(organizationId);
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
