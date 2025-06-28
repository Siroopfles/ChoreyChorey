
'use server';

import { getJiraIssue } from '@/lib/jira-service';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Organization } from '@/lib/types';

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


export async function getJiraItemFromUrl(organizationId: string, url: string) {
     try {
        await getJiraConfig(organizationId);

        const urlParts = url.match(/\/browse\/([A-Z0-9]+-[0-9]+)/);
        if (!urlParts) {
            return { error: 'Invalid Jira URL format. Expected format: .../browse/PROJECT-123' };
        }
        const [, issueKey] = urlParts;

        const item = await getJiraIssue(issueKey);
        return { item };
    } catch (e: any) {
        return { error: e.message };
    }
}
