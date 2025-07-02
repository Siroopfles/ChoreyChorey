'use client';

import { useOrganization } from '@/contexts/system/organization-context';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

// Lazy load the settings components
import dynamic from 'next/dynamic';
const StatusSettings = dynamic(() => import('@/components/chorey/settings/workflow/status-settings'), { loading: () => <Loader2 className="h-5 w-5 animate-spin" /> });
const PrioritySettings = dynamic(() => import('@/components/chorey/settings/workflow/priority-settings'), { loading: () => <Loader2 className="h-5 w-5 animate-spin" /> });
const LabelSettings = dynamic(() => import('@/components/chorey/settings/workflow/label-settings'), { loading: () => <Loader2 className="h-5 w-5 animate-spin" /> });
const CustomFieldsSettings = dynamic(() => import('@/components/chorey/settings/workflow/custom-fields-settings'), { loading: () => <Loader2 className="h-5 w-5 animate-spin" /> });

export default function WorkflowPage() {
    const { currentOrganization, loading } = useOrganization();

    if (loading) {
        return (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }

    if (!currentOrganization) {
        return <p>Geen organisatie gevonden.</p>
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
                <div>
                    <h1 className="text-3xl font-bold">Workflow & Velden</h1>
                    <p className="text-muted-foreground">Pas statussen, prioriteiten, labels en eigen velden aan om bij uw proces te passen.</p>
                </div>
            </div>
            <Separator />
            <StatusSettings organization={currentOrganization} />
            <PrioritySettings organization={currentOrganization} />
            <LabelSettings organization={currentOrganization} />
            <CustomFieldsSettings organization={currentOrganization} />
        </div>
    );
}
