

'use client';

import { useOrganization } from '@/contexts/system/organization-context';
import { Loader2, ArrowLeft } from 'lucide-react';
import WorkflowSettings from '@/components/chorey/settings/general/workflow-settings';
import CustomFieldsSettings from '@/components/chorey/settings/general/custom-fields-settings';
import { PERMISSIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WorkflowOrgSettingsPage() {
    const { loading, currentOrganization, currentUserPermissions } = useOrganization();
    
    if (loading) {
        return (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }

    const canManageWorkflow = currentUserPermissions.includes(PERMISSIONS.MANAGE_WORKFLOW);

    if (!currentOrganization) {
        return <div className="text-center"><p>Selecteer een organisatie om de instellingen te beheren.</p></div>
    }
    
    if (!canManageWorkflow) {
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
                <h1 className="font-semibold text-lg md:text-2xl">Workflow & Velden</h1>
            </div>
            <WorkflowSettings organization={currentOrganization} />
            <CustomFieldsSettings organization={currentOrganization} />
        </div>
    );
}
