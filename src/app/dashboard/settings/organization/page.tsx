

'use client';

import { useAuth } from '@/contexts/auth-context';
import { Loader2, ArrowLeft } from 'lucide-react';
import OrganizationSettings from '@/components/chorey/settings/organization-settings';
import DangerZone from '@/components/chorey/settings/danger-zone';
import WorkflowSettings from '@/components/chorey/settings/workflow-settings';
import WebhookSettings from '@/components/chorey/settings/webhook-settings';
import ApiKeySettings from '@/components/chorey/settings/api-key-settings';
import { PERMISSIONS } from '@/lib/types';
import LimitSettings from '@/components/chorey/settings/limit-settings';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import CustomFieldsSettings from '@/components/chorey/settings/custom-fields-settings';
import AnnouncementSettings from '@/components/chorey/settings/announcement-settings';


export default function OrganizationSettingsPage() {
  const { user, loading: authLoading, currentOrganization, currentUserPermissions } = useAuth();

  if (authLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const canManageOrg = currentUserPermissions.includes(PERMISSIONS.MANAGE_ORGANIZATION);
  const canManageApiKeys = currentUserPermissions.includes(PERMISSIONS.MANAGE_API_KEYS);
  
  if (!currentOrganization) {
    return (
        <div className="text-center">
            <p>Selecteer een organisatie om de instellingen te beheren.</p>
        </div>
    )
  }

  if (!canManageOrg) {
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

        <OrganizationSettings organization={currentOrganization} />
        <AnnouncementSettings organization={currentOrganization} />
        <LimitSettings organization={currentOrganization} />
        <WebhookSettings />
        {canManageApiKeys && <ApiKeySettings />}
        <WorkflowSettings organization={currentOrganization} />
        <CustomFieldsSettings organization={currentOrganization} />
        <DangerZone
            organization={currentOrganization}
            isOwner={currentOrganization.ownerId === user.id}
        />
    </div>
  );
}
