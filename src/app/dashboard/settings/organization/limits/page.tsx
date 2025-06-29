
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Loader2, ArrowLeft } from 'lucide-react';
import DangerZone from '@/components/chorey/settings/danger-zone';
import LimitSettings from '@/components/chorey/settings/limit-settings';
import { PERMISSIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SessionPolicySettings from '@/components/chorey/settings/session-policy-settings';
import IpWhitelistSettings from '@/components/chorey/settings/ip-whitelist-settings';
import { useOrganization } from '@/contexts/organization-context';

export default function LimitsOrgSettingsPage() {
    const { user } = useAuth();
    const { loading, currentOrganization, currentUserPermissions } = useOrganization();
    
    if (loading || !user) {
        return (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }

    const canManageSecurity = currentUserPermissions.includes(PERMISSIONS.MANAGE_SECURITY_SETTINGS);
    const canManageIpWhitelist = currentUserPermissions.includes(PERMISSIONS.MANAGE_IP_WHITELIST);

    if (!currentOrganization) {
        return <div className="text-center"><p>Selecteer een organisatie om de instellingen te beheren.</p></div>
    }
    
    if (!canManageSecurity) {
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
                <h1 className="font-semibold text-lg md:text-2xl">Beveiliging & Limieten</h1>
            </div>
            <SessionPolicySettings organization={currentOrganization} />
            {canManageIpWhitelist && <IpWhitelistSettings organization={currentOrganization} />}
            <LimitSettings organization={currentOrganization} />
            <DangerZone
                organization={currentOrganization}
                isOwner={currentOrganization.ownerId === user.id}
            />
        </div>
    );
}
