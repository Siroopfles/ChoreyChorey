

'use client';

import { useAuth } from '@/contexts/user/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DEFAULT_ROLES, PERMISSIONS_DESCRIPTIONS } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default function MyPermissionsPage() {
    const { user, loading, currentUserRole, currentUserPermissions, currentOrganization } = useAuth();

    if (loading || !user) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const allRoles = {
        ...DEFAULT_ROLES,
        ...(currentOrganization?.settings?.customization?.customRoles || {})
    };
    const roleName = currentUserRole ? (allRoles[currentUserRole as keyof typeof allRoles]?.name || currentUserRole) : 'Geen rol';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/settings">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Terug naar Instellingen</span>
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2"><Shield /> Mijn Permissies</h1>
                    <p className="text-muted-foreground">Een overzicht van wat je kunt doen met je huidige rol.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Uw Rol: <Badge variant="secondary" className="text-lg">{roleName}</Badge></CardTitle>
                    <CardDescription>
                        Dit zijn de acties die u mag uitvoeren binnen de huidige organisatie.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {currentUserPermissions.length > 0 ? (
                        <ul className="space-y-3">
                            {currentUserPermissions.sort().map(permission => (
                                <li key={permission} className="p-3 rounded-md border bg-muted/50">
                                    <p className="font-semibold">{PERMISSIONS_DESCRIPTIONS[permission]?.name || permission}</p>
                                    <p className="text-sm text-muted-foreground">{PERMISSIONS_DESCRIPTIONS[permission]?.description || 'Geen beschrijving'}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">U heeft momenteel geen specifieke permissies.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
