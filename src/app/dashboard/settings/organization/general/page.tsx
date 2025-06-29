
'use client';

import { useOrganization } from '@/contexts/organization-context';
import { Loader2, ArrowLeft } from 'lucide-react';
import OrganizationSettings from '@/components/chorey/settings/organization-settings';
import AnnouncementSettings from '@/components/chorey/settings/announcement-settings';
import BrandingSettings from '@/components/chorey/settings/branding-settings';
import { PERMISSIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

export default function GeneralOrgSettingsPage() {
    const { loading, currentOrganization, currentUserPermissions } = useOrganization();
    
    if (loading) {
        return (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }

    if (!currentOrganization) {
        return <div className="text-center"><p>Selecteer een organisatie om de instellingen te beheren.</p></div>
    }
    
    const canManageGeneral = currentUserPermissions.includes(PERMISSIONS.MANAGE_GENERAL_SETTINGS);
    const canManageAnnouncements = currentUserPermissions.includes(PERMISSIONS.MANAGE_ANNOUNCEMENTS);
    const canManageBranding = currentUserPermissions.includes(PERMISSIONS.MANAGE_BRANDING);
    
    const hasAnyPermission = canManageGeneral || canManageAnnouncements || canManageBranding;

    if (!hasAnyPermission) {
       return (
            <Card>
                <CardHeader>
                    <CardTitle>Geen Toegang</CardTitle>
                </CardHeader>
            </Card>
       )
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
                <h1 className="font-semibold text-lg md:text-2xl">Algemene Instellingen</h1>
            </div>
            {canManageGeneral && <OrganizationSettings organization={currentOrganization} currentUserPermissions={currentUserPermissions} />}
            {canManageAnnouncements && <AnnouncementSettings organization={currentOrganization} />}
            {canManageBranding && <BrandingSettings organization={currentOrganization} />}
        </div>
    );
}
