
'use server';

import { getJiraIssue, searchJiraIssues } from '@/lib/integrations/jira-service';
import { db } from '@/lib/core/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Organization, JiraLink } from '@/lib/types';

async function getJiraConfig(organizationId: string) {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) {
        throw new Error('Organization not found');
    }
    const orgData = orgDoc.data() as Organization;
    const isEnabled = orgData.settings?.features?.jira;
    if (!isEnabled) {
        throw new Error('Jira integration is not enabled for this organization.');
    }
}

export async function searchJiraItems(organizationId: string, query: string): Promise<{ data: { items: JiraLink[] } | null; error: string | null; }> {
    try {
        await getJiraConfig(organizationId);
        const items = await searchJiraIssues(query);
        return { data: { items }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getJiraItemFromUrl(organizationId: string, url: string): Promise<{ data: { item: JiraLink } | null; error: string | null; }> {
     try {
        await getJiraConfig(organizationId);

        const urlParts = url.match(/\/browse\/([A-Z0-9]+-[0-9]+)/);
        if (!urlParts) {
            return { data: null, error: 'Invalid Jira URL format. Expected format: .../browse/PROJECT-123' };
        }
        const [, issueKey] = urlParts;

        const item = await getJiraIssue(issueKey);
        return { data: { item }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}
