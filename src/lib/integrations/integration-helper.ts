
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Organization } from '@/lib/types';

type GitProvider = 'github' | 'gitlab' | 'bitbucket';
type ConfigType<T extends GitProvider> = NonNullable<NonNullable<Organization['settings']>[T]>;

export async function getGitProviderConfig<T extends GitProvider>(
    organizationId: string,
    provider: T
): Promise<ConfigType<T>> {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) {
        throw new Error('Organisatie niet gevonden.');
    }

    const orgData = orgDoc.data() as Organization;
    const config = orgData.settings?.[provider];

    let isConfigured = false;
    if (provider === 'github' && config) {
        isConfigured = !!(config as any).owner && !!(config as any).repos?.length;
    } else if (provider === 'gitlab' && config) {
        isConfigured = !!(config as any).projects?.length;
    } else if (provider === 'bitbucket' && config) {
        isConfigured = !!(config as any).workspace && !!(config as any).repos?.length;
    }

    if (!config || !isConfigured) {
        throw new Error(`${provider.charAt(0).toUpperCase() + provider.slice(1)} integratie is niet geconfigureerd voor deze organisatie.`);
    }
    
    return config as ConfigType<T>;
}
