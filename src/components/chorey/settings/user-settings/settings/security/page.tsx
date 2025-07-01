
'use client';

import { useAuth } from '@/contexts/user/auth-context';
import { Loader2, ArrowLeft, Shield } from 'lucide-react';
import { PERMISSIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SessionPolicySettings from '@/components/chorey/settings/security/session-policy-settings';
import IpWhitelistSettings from '@/components/chorey/settings/security/ip-whitelist-settings';

export default function SecuritySettingsPage() {
  const { user, loading: authLoading, currentOrganization, currentUserPermissions } = useAuth();

  if (authLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const canManageSecurity = currentUserPermissions.includes(PERMISSIONS.MANAGE_ORGANIZATION);
  const canManageIpWhitelist = currentUserPermissions.includes(PERMISSIONS.MANAGE_IP_WHITELIST);

  if (!currentOrganization) {
    return <div className="text-center"><p>Selecteer een organisatie om de instellingen te beheren.</p></div>
  }

  if (!canManageSecurity) {
    return <div className="text-center"><p>U heeft geen permissie om de beveiligingsinstellingen te bekijken.</p></div>
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
                <Link href="/dashboard/settings">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Terug naar Instellingen</span>
                </Link>
            </Button>
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><Shield /> Beveiliging</h1>
                <p className="text-muted-foreground">Beheer de beveiligingsinstellingen van de organisatie.</p>
            </div>
        </div>
        <SessionPolicySettings organization={currentOrganization} />
        {canManageIpWhitelist && <IpWhitelistSettings organization={currentOrganization} />}
    </div>
  );
}
