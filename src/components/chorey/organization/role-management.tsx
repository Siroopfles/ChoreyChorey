'use client';

import { useAuth } from '@/contexts/user/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, Plus } from 'lucide-react';
import { PERMISSIONS, PERMISSIONS_DESCRIPTIONS, DEFAULT_ROLES } from '@/lib/types';
import type { Organization, Permission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CreateEditRoleDialog } from './create-edit-role-dialog';
import { useOrganization } from '@/contexts/system/organization-context';

export function RoleManagement() {
    const { currentOrganization } = useOrganization();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<{ id: string, name: string, permissions: Permission[] } | null>(null);

    if (!currentOrganization) return null;

    const allRoles = {
        ...DEFAULT_ROLES,
        ...(currentOrganization.settings?.customization?.customRoles || {})
    };

    const roleKeys = Object.keys(allRoles);
    const permissionKeys = Object.values(PERMISSIONS);

    const handleEditRole = (roleId: string) => {
        if (DEFAULT_ROLES[roleId as keyof typeof DEFAULT_ROLES]) return; // Don't allow editing default roles
        const role = allRoles[roleId as keyof typeof allRoles];
        setEditingRole({ id: roleId, ...role });
        setDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingRole(null);
        setDialogOpen(true);
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Permissie Matrix</CardTitle>
                        <CardDescription>Een overzicht van welke acties elke rol kan uitvoeren binnen de organisatie.</CardDescription>
                    </div>
                    <Button onClick={handleAddNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nieuwe Rol
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Permissie</TableHead>
                                    {roleKeys.map(roleKey => (
                                        <TableHead key={roleKey} className="text-center">
                                            <button 
                                                onClick={() => handleEditRole(roleKey)}
                                                disabled={!!DEFAULT_ROLES[roleKey as keyof typeof DEFAULT_ROLES]}
                                                className="font-semibold disabled:cursor-not-allowed disabled:opacity-70 hover:underline"
                                            >
                                                {allRoles[roleKey as keyof typeof allRoles].name}
                                            </button>
                                        </TableHead>
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
                                                {allRoles[roleKey as keyof typeof allRoles].permissions.includes(permissionKey) && (
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

            <CreateEditRoleDialog 
                isOpen={dialogOpen}
                setIsOpen={setDialogOpen}
                editingRole={editingRole}
            />
        </>
    );
}
