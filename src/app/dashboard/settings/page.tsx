
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import ProfileSettings from '@/components/chorey/settings/profile-settings';
import OrganizationSettings from '@/components/chorey/settings/organization-settings';
import DangerZone from '@/components/chorey/settings/danger-zone';
import DebugSettings from '@/components/chorey/settings/debug-settings';

export default function SettingsPage() {
  const { user, loading: authLoading, currentOrganization, currentUserRole } = useAuth();

  if (authLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isOwner = currentUserRole === 'Owner';

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Instellingen</h1>
      </div>
      
      <ProfileSettings user={user} />

      {currentOrganization && (
        <>
          {isOwner && <OrganizationSettings organization={currentOrganization} />}
          <DangerZone
            organization={currentOrganization}
            isOwner={isOwner}
          />
        </>
      )}

      <DebugSettings />
    </div>
  );
}
