
'use server';

import { searchBitbucketIssues, getBitbucketItem } from '@/lib/bitbucket-service';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Organization } from '@/lib/types';

async function getBitbucketConfig(organizationId: string) {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) throw new Error('Organization not found');

    const orgData = orgDoc.data() as Organization;
    const bitbucketConfig = orgData.settings?.bitbucket;
    if (!bitbucketConfig || !bitbucketConfig.workspace || !bitbucketConfig.repos || bitbucketConfig.repos.length === 0) {
        throw new Error('Bitbucket integration is not configured for this organization.');
    }
    return bitbucketConfig;
}

export async function searchBitbucketItems(organizationId: string, repo: string, query: string) {
    try {
        const config = await getBitbucketConfig(organizationId);
        const results = await searchBitbucketIssues(config.workspace, repo, query);
        return { items: results };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getBitbucketItemFromUrl(organizationId: string, url: string) {
    try {
        const config = await getBitbucketConfig(organizationId);
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
