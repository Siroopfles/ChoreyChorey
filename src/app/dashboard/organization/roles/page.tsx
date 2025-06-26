
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RoleManagement } from '@/components/chorey/organization/role-management';

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
            
            <RoleManagement />
        </div>
    );
}
