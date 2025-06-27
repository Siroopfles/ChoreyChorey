
'use client';

import type { User as UserType, RoleName } from '@/lib/types';
import { DEFAULT_ROLES, statusStyles, PERMISSIONS } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { updateUserRoleInOrganization } from '@/app/actions/organization.actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';

export function MemberList({ usersInOrg }: { usersInOrg: UserType[] }) {
    const { currentOrganization, user: currentUser, currentUserPermissions } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    if (!currentOrganization) return null;

    const allRoles = {
        ...DEFAULT_ROLES,
        ...(currentOrganization.settings?.customization?.customRoles || {})
    };
    
    const canManageRoles = currentUserPermissions.includes(PERMISSIONS.MANAGE_ROLES);
    
    const handleRoleChange = async (targetUserId: string, newRole: RoleName) => {
        if (!currentUser) return;

        const result = await updateUserRoleInOrganization(currentOrganization.id, targetUserId, newRole, currentUser.id);

        if (result.error) {
            toast({ title: "Fout", description: result.error, variant: 'destructive' });
        } else {
            toast({ title: "Succes", description: "Rol is succesvol bijgewerkt." });
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Ledenbeheer</CardTitle>
                <CardDescription>Beheer de rollen van de leden in je organisatie.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {usersInOrg.map(member => {
                        const roleId = (currentOrganization.members || {})[member.id]?.role;
                        const roleName = roleId ? allRoles[roleId]?.name : 'Geen rol';
                        const isOwner = member.id === currentOrganization.ownerId;
                        const status = member.status?.type || 'Offline';
                        const statusStyle = statusStyles[status] || statusStyles.Offline;

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
                                                <p>{statusStyle.label}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <div>
                                        <p className="font-medium">{member.name}</p>
                                        <p className="text-sm text-muted-foreground">{roleName}</p>
                                    </div>
                                </button>
                                {canManageRoles && !isOwner && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {Object.entries(allRoles).map(([roleKey, roleDetails]) => {
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
    );
}
