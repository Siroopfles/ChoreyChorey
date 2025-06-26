
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import { PERMISSIONS, PERMISSIONS_DESCRIPTIONS, ROLES } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RolesAndPermissionsPage() {
    const { currentUserRole, loading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (currentUserRole !== 'Owner' && currentUserRole !== 'Admin') {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[400px]">
                <h3 className="text-2xl font-bold tracking-tight">Geen Toegang</h3>
                <p className="text-sm text-muted-foreground">U heeft niet de juiste permissies om deze pagina te bekijken.</p>
            </div>
        );
    }

    const permissionKeys = Object.values(PERMISSIONS);
    const roleKeys = Object.keys(ROLES);

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/organization">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Terug</span>
                    </Link>
                </Button>
                 <h1 className="text-3xl font-bold">Rollen & Permissies</h1>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Permissie Matrix</CardTitle>
                    <CardDescription>Een overzicht van welke acties elke rol kan uitvoeren binnen de organisatie.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Permissie</TableHead>
                                    {roleKeys.map(roleKey => (
                                        <TableHead key={roleKey} className="text-center">{ROLES[roleKey].name}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {permissionKeys.map(permissionKey => (
                                    <TableRow key={permissionKey}>
                                        <TableCell>
                                            <p className="font-medium">{PERMISSIONS_DESCRIPTIONS[permissionKey].name}</p>
                                            <p className="text-xs text-muted-foreground">{PERMISSIONS_DESCRIPTIONS[permissionKey].description}</p>
                                        </TableCell>
                                        {roleKeys.map(roleKey => (
                                            <TableCell key={`${permissionKey}-${roleKey}`} className="text-center">
                                                {ROLES[roleKey].permissions.includes(permissionKey) && (
                                                    <div className="flex justify-center">
                                                        <Check className="h-5 w-5 text-green-500" />
                                                    </div>
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
