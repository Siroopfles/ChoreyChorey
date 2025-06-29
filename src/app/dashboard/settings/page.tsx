
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, Building, ArrowRight, Plug, Shield, Settings2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { PERMISSIONS } from '@/lib/types';

export default function SettingsPage() {
    const { user, loading: authLoading, currentUserRole, currentUserPermissions } = useAuth();
    
    if (authLoading || !user) {
        return (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }

    const canManageOrg = currentUserPermissions.includes(PERMISSIONS.MANAGE_ORGANIZATION);
    const canManageIntegrations = currentUserPermissions.includes(PERMISSIONS.MANAGE_INTEGRATIONS);

    return (
        <div className="space-y-6">
            <h1 className="font-semibold text-lg md:text-2xl">Instellingen</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <User className="h-6 w-6 text-primary" />
                            Profiel & Account
                        </CardTitle>
                        <CardDescription>
                            Beheer uw persoonlijke gegevens, avatar, vaardigheden, beveiliging en notificaties.
                        </CardDescription>
                    </CardHeader>
                    <div className="p-6 pt-0">
                         <Button asChild>
                            <Link href="/dashboard/settings/profile">
                                Profielinstellingen <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </Card>
                
                 <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Shield className="h-6 w-6 text-primary" />
                            Mijn Permissies
                        </CardTitle>
                        <CardDescription>
                            Bekijk een gedetailleerd overzicht van de acties die jij mag uitvoeren met jouw huidige rol.
                        </CardDescription>
                    </CardHeader>
                    <div className="p-6 pt-0">
                        <Button asChild>
                        <Link href="/dashboard/settings/my-permissions">
                            Bekijk Mijn Permissies <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    </div>
                </Card>

                {canManageOrg && (
                  <>
                    <Card className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Building className="h-6 w-6 text-primary" />
                                Organisatie
                            </CardTitle>
                            <CardDescription>
                                Beheer algemene instellingen, workflow, limieten en de gevarenzone voor de organisatie.
                            </CardDescription>
                        </CardHeader>
                         <div className="p-6 pt-0">
                            <Button asChild>
                                <Link href="/dashboard/settings/organization">
                                    Organisatie-instellingen <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                     <Card className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Shield className="h-6 w-6 text-primary" />
                                Beveiliging
                            </CardTitle>
                            <CardDescription>
                                Configureer het sessiebeleid en beheer de IP-whitelist voor extra beveiliging.
                            </CardDescription>
                        </CardHeader>
                         <div className="p-6 pt-0">
                            <Button asChild>
                                <Link href="/dashboard/settings/security">
                                    Beveiligingsinstellingen <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                     <Card className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Settings2 className="h-6 w-6 text-primary" />
                                Feature Instellingen
                            </CardTitle>
                            <CardDescription>
                               Schakel interne Chorey-modules zoals gamification, doelen en de ideeënbus in of uit.
                            </CardDescription>
                        </CardHeader>
                         <div className="p-6 pt-0">
                            <Button asChild>
                                <Link href="/dashboard/settings/features">
                                    Beheer Features <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                  </>
                )}

                {canManageIntegrations && (
                    <Card className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Plug className="h-6 w-6 text-primary" />
                                Integraties
                            </CardTitle>
                            <CardDescription>
                                Verbind Chorey met externe applicaties zoals Zapier, Slack, GitHub, en meer.
                            </CardDescription>
                        </CardHeader>
                         <div className="p-6 pt-0">
                            <Button asChild>
                                <Link href="/dashboard/settings/integrations">
                                    Beheer Integraties <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
