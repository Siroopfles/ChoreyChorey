'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings, Workflow, Code2, BarChartBig, ArrowRight } from 'lucide-react';

export default function OrganizationSettingsHubPage() {
    const settingsPages = [
        {
            href: '/dashboard/settings/organization/general',
            icon: Settings,
            title: 'Algemeen & Branding',
            description: 'Beheer de naam, aankondigingen en het uiterlijk van de organisatie.',
        },
        {
            href: '/dashboard/settings/organization/workflow',
            icon: Workflow,
            title: 'Workflow & Velden',
            description: 'Pas statussen, labels, prioriteiten en eigen velden aan.',
        },
        {
            href: '/dashboard/settings/organization/developer',
            icon: Code2,
            title: 'Developer Instellingen',
            description: 'Beheer API-sleutels en webhooks voor integraties.',
        },
        {
            href: '/dashboard/settings/organization/limits',
            icon: BarChartBig,
            title: 'Limieten & Gevarenzone',
            description: 'Stel limieten in en beheer risicovolle acties zoals het verwijderen van de organisatie.',
        },
    ];

    return (
        <div className="space-y-6">
            <h1 className="font-semibold text-lg md:text-2xl">Organisatie Instellingen</h1>
            <p className="text-muted-foreground">Selecteer een categorie om te beheren.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settingsPages.map((page) => (
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
                                    Beheren <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
