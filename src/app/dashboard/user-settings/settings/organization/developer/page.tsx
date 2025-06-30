'use client';

import { useAuth } from '@/contexts/auth-context';
import { Loader2, ArrowLeft } from 'lucide-react';
import WebhookSettings from '@/components/chorey/settings/webhook-settings';
import ApiKeySettings from '@/components/chorey/settings/api-key-settings';
import { PERMISSIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DeveloperOrgSettingsPage() {
    const { user, loading, currentOrganization, currentUserPermissions } = useAuth();
    
    if (loading || !user) {
        return (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }

    const canManageOrg = currentUserPermissions.includes(PERMISSIONS.MANAGE_ORGANIZATION);
    const canManageApiKeys = currentUserPermissions.includes(PERMISSIONS.MANAGE_API_KEYS);

    if (!currentOrganization) {
        return <div className="text-center"><p>Selecteer een organisatie om de instellingen te beheren.</p></div>
    }
    
    if (!canManageOrg) {
        return <div className="text-center"><p>U heeft geen permissie om deze instellingen te bekijken.</p></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/settings/organization">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Terug naar Organisatie Instellingen</span>
                    </Link>
                </Button>
                <h1 className="font-semibold text-lg md:text-2xl">Developer Instellingen</h1>
            </div>
            <WebhookSettings />
            {canManageApiKeys && <ApiKeySettings />}
        </div>
    );
}
