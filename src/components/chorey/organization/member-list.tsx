

'use client';

import { useAuth } from '@/contexts/user/auth-context';
import { updateUserRoleInOrganization } from '@/app/actions/user/member.actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Shield, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ManagePermissionsDialog } from './manage-permissions-dialog';
import { ROLE_OWNER } from '@/lib/constants';
import type { User } from '@/lib/types/auth';
import type { RoleName } from '@/lib/types/permissions';
import { statusStyles } from '@/lib/types/ui';
import { PERMISSIONS, DEFAULT_ROLES } from '@/lib/types/permissions';


export function MemberList({ usersInOrg }: { usersInOrg: User[] }) {
    const { currentOrganization, user: currentUser, currentUserPermissions } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [editingMember, setEditingMember] = useState<User | null>(null);
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);

    if (!currentOrganization) return null;

    const allRoles = {
        ...DEFAULT_ROLES,
        ...(currentOrganization.settings?.customization?.customRoles || {})
    };
    
    const canManageRoles = currentUserPermissions.includes(PERMISSIONS.MANAGE_ROLES);
    const canManagePermissions = currentUserPermissions.includes(PERMISSIONS.MANAGE_MEMBER_PERMISSIONS);
    
    const handleRoleChange = async (targetUserId: string, newRole: RoleName) => {
        if (!currentUser) return;

        const result = await updateUserRoleInOrganization(currentOrganization.id, targetUserId, newRole, currentUser.id);

        if (result.error) {
            toast({ title: "Fout", description: result.error, variant: 'destructive' });
        } else {
            toast({ title: "Succes", description: "Rol is succesvol bijgewerkt." });
        }
    };

    const handleEditPermissions = (member: User) => {
        setEditingMember(member);
        setPermissionsDialogOpen(true);
    };
    
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Ledenbeheer</CardTitle>
                    <CardDescription>Beheer de rollen en permissies van de leden in je organisatie.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {usersInOrg.map(member => {
                            const memberData = (currentOrganization.members || {})[member.id];
                            const roleId = memberData?.role;
                            const roleName = roleId ? allRoles[roleId]?.name : 'Geen rol';
                            const isOwner = member.id === currentOrganization.ownerId;
                            const status = member.status?.type || 'Offline';
                            const statusStyle = statusStyles[status] || statusStyles.Offline;
                            const presence = member.status?.currentPage;
                            const statusLabel = presence || statusStyle.label;
                            const canBeManaged = !isOwner;
                            const hasOverrides = !!(memberData?.permissionOverrides?.granted?.length || memberData?.permissionOverrides?.revoked?.length);

                            return (
                                <div key={member.id} className="flex items-center justify-between">
                                    <button className="flex items-center gap-3 text-left w-full" onClick={() => router.push(`/dashboard/profile/${member.id}`)}>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="relative">
                                                        <Avatar>
                                                            <AvatarImage src={member.avatar} />
                                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className={cn("absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background", statusStyle.dot)} />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{statusLabel}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <div>
                                            <p className="font-medium flex items-center gap-2">
                                                {member.name}
                                                {hasOverrides && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <UserCog className="h-3.5 w-3.5 text-blue-500" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Deze gebruiker heeft specifieke permissie-overschrijvingen.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{roleName}</p>
                                        </div>
                                    </button>
                                    {canBeManaged && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {canManagePermissions && (
                                                    <DropdownMenuItem onSelect={() => handleEditPermissions(member)}>
                                                        <UserCog className="mr-2 h-4 w-4" />
                                                        <span>Permissies Aanpassen</span>
                                                    </DropdownMenuItem>
                                                )}
                                                {canManageRoles && <DropdownMenuSeparator />}
                                                {canManageRoles && Object.entries(allRoles).map(([roleKey, roleDetails]) => {
                                                    if (roleKey === 'Owner') return null; // Can't assign Owner role
                                                    return (
                                                        <DropdownMenuItem key={roleKey} onSelect={() => handleRoleChange(member.id, roleKey)}>
                                                            <Shield className="mr-2 h-4 w-4" />
                                                            <span>Wijs rol '{roleDetails.name}' toe</span>
                                                        </DropdownMenuItem>
                                                    )
                                                })}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
            {editingMember && (
                <ManagePermissionsDialog
                    isOpen={permissionsDialogOpen}
                    setIsOpen={setPermissionsDialogOpen}
                    member={editingMember}
                />
            )}
        </>
    );
}
