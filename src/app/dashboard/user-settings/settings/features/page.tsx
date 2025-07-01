
'use client';

import { useAuth } from '@/contexts/user/auth-context';
import { Loader2, ArrowLeft, Settings } from 'lucide-react';
import FeatureToggleSettings from '@/components/chorey/settings/general/feature-toggle-settings';
import { PERMISSIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FeaturesSettingsPage() {
  const { user, loading: authLoading, currentOrganization, currentUserPermissions } = useAuth();

  if (authLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const canManageOrg = currentUserPermissions.includes(PERMISSIONS.MANAGE_ORGANIZATION);

  if (!currentOrganization) {
    return <div className="text-center"><p>Selecteer een organisatie om de instellingen te beheren.</p></div>
  }

  if (!canManageOrg) {
    return <div className="text-center"><p>U heeft geen permissie om de feature instellingen te bekijken.</p></div>
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
                <Link href="/dashboard/user-settings/settings/organization/general">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Terug naar Instellingen</span>
                </Link>
            </Button>
             <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><Settings /> Feature Instellingen</h1>
                <p className="text-muted-foreground">Schakel interne applicatie-modules aan of uit.</p>
            </div>
        </div>
        <FeatureToggleSettings organization={currentOrganization} />
    </div>
  );
}
