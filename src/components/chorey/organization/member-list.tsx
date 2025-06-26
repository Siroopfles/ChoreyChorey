
'use client';

import type { User as UserType, RoleName } from '@/lib/types';
import { ROLES } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { updateUserRoleInOrganization } from '@/app/actions/organization.actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Shield } from 'lucide-react';


export function MemberList({ usersInOrg }: { usersInOrg: UserType[] }) {
    const { currentOrganization, user: currentUser, currentUserRole } = useAuth();
    const { toast } = useToast();

    if (!currentOrganization) return null;
    
    const canManageRoles = currentUserRole === 'Owner' || currentUserRole === 'Admin';
    
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
                        const role = (currentOrganization.members || {})[member.id]?.role;
                        const isOwner = member.id === currentOrganization.ownerId;
                        return (
                            <div key={member.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{member.name}</p>
                                        <p className="text-sm text-muted-foreground">{role ? ROLES[role]?.name : 'Geen rol'}</p>
                                    </div>
                                </div>
                                {canManageRoles && !isOwner && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {Object.keys(ROLES).map(roleKey => (
                                                <DropdownMenuItem key={roleKey} onSelect={() => handleRoleChange(member.id, roleKey as RoleName)}>
                                                    <Shield className="mr-2 h-4 w-4" />
                                                    <span>Wijs rol '{ROLES[roleKey as RoleName].name}' toe</span>
                                                </DropdownMenuItem>
                                            ))}
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
