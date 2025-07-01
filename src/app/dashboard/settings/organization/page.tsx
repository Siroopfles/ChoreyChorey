
'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings, Workflow, Code2, Shield, ShieldQuestion } from 'lucide-react';
import { useOrganization } from '@/contexts/system/organization-context';
import { PERMISSIONS } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';

export default function OrganizationSettingsHubPage() {
    const { currentUserPermissions } = useOrganization();

    const settingsPages = [
        {
            href: '/dashboard/settings/organization/general',
            icon: Settings,
            title: 'Algemeen & Branding',
            description: 'Beheer de naam, aankondigingen en het uiterlijk van de organisatie.',
            permission: PERMISSIONS.MANAGE_GENERAL_SETTINGS,
        },
        {
            href: '/dashboard/settings/organization/workflow',
            icon: Workflow,
            title: 'Workflow & Velden',
            description: 'Pas statussen, labels, prioriteiten en eigen velden aan.',
            permission: PERMISSIONS.MANAGE_WORKFLOW,
        },
        {
            href: '/dashboard/settings/organization/developer',
            icon: Code2,
            title: 'Developer Instellingen',
            description: 'Beheer API-sleutels en webhooks voor integraties.',
            permission: PERMISSIONS.MANAGE_WEBHOOKS, // A base permission to see the page
        },
        {
            href: '/dashboard/settings/organization/limits',
            icon: Shield,
            title: 'Beveiliging & Limieten',
            description: 'Beheer sessiebeleid, IP-whitelisting en risicovolle acties.',
            permission: PERMISSIONS.MANAGE_SECURITY_SETTINGS,
        },
        {
            href: '/dashboard/settings/features',
            icon: ShieldQuestion,
            title: 'Feature Vlaggen',
            description: 'Schakel kernmodules van de applicatie in of uit.',
            permission: PERMISSIONS.MANAGE_FEATURE_TOGGLES,
        }
    ];

    const accessiblePages = settingsPages.filter(page => currentUserPermissions.includes(page.permission));

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
            <p className="text-muted-foreground">Selecteer een categorie om te beheren.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accessiblePages.map((page) => (
                    <Card key={page.href} className="hover:border-primary/50 transition-colors flex flex-col">
                        <CardHeader className="flex-grow">
                            <CardTitle className="flex items-center gap-3">
                                <page.icon className="h-6 w-6 text-primary" />
                                {page.title}
                            </CardTitle>
                            <CardDescription>
                                {page.description}
                            </CardDescription>
                        </CardHeader>
                        <div className="p-6 pt-0">
                            <Button asChild>
                                <Link href={page.href}>
                                    Beheren
                                </Link>
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
