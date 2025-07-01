'use client';

import { useAuth } from '@/contexts/user/auth-context';
import { useOrganization } from '@/contexts/system/organization-context';
import { Loader2, ArrowLeft } from 'lucide-react';
import OrganizationSettings from '@/components/chorey/settings/general/organization-settings';
import DangerZone from '@/components/chorey/settings/security/danger-zone';
import { PERMISSIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OrganizationSettingsPage() {
  const { user, loading: authLoading, currentUserPermissions } = useAuth();
  const { currentOrganization } = useOrganization();

  if (authLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const canManageOrganization = currentUserPermissions.includes(PERMISSIONS.MANAGE_ORGANIZATION);
  
  if (!currentOrganization) {
    return (
        <div className="text-center">
            <p>Selecteer een organisatie om de instellingen te beheren.</p>
        </div>
    )
  }

  if (!canManageOrganization) {
    return (
        <div className="text-center">
            <p>U heeft geen permissie om de organisatie-instellingen te bekijken.</p>
        </div>
    )
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
            <h1 className="font-semibold text-lg md:text-2xl">Organisatie Instellingen</h1>
        </div>

        <OrganizationSettings organization={currentOrganization} currentUserPermissions={currentUserPermissions}/>
        <DangerZone
            organization={currentOrganization}
            isOwner={currentOrganization.ownerId === user.id}
        />
    </div>
  );
}
