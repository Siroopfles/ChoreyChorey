
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/organization-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProjectRole } from '@/app/actions/project.actions';
import type { Project, User, RoleName } from '@/lib/types';
import { DEFAULT_ROLES } from '@/lib/types';
import { ROLE_OWNER } from '@/lib/constants';

interface ManageProjectAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function ManageProjectAccessDialog({ open, onOpenChange, project }: ManageProjectAccessDialogProps) {
    const { user: currentUser } = useAuth();
    const { users, currentOrganization } = useOrganization();
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const { toast } = useToast();
    
    if (!currentOrganization) return null;

    const allRoles = {
        ...DEFAULT_ROLES,
        ...(currentOrganization.settings?.customization?.customRoles || {})
    };

    const handleRoleChange = async (targetUserId: string, newRole: RoleName | 'inherit') => {
        if (!currentUser) return;

        setIsLoading(prev => ({ ...prev, [targetUserId]: true }));
        const result = await updateProjectRole(project.id, currentOrganization.id, targetUserId, newRole, currentUser.id);
        
        if (result.error) {
            toast({ title: 'Fout', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Rol bijgewerkt!', description: `Rol voor gebruiker is aangepast voor dit project.` });
            // The organization context will automatically update with the new project data.
        }

        setIsLoading(prev => ({ ...prev, [targetUserId]: false }));
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Toegang Beheren voor: {project.name}</DialogTitle>
                    <DialogDescription>
                        Wijs project-specifieke rollen toe aan gebruikers. Als 'Erf van Organisatie' is geselecteerd, wordt de algemene organisatierol van de gebruiker gebruikt.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] -mx-6 px-6">
                    <div className="space-y-4 py-4">
                        {users.map((member) => {
                            const projectRole = project.projectRoles?.[member.id];
                            const orgRole = currentOrganization.members[member.id]?.role;
                            const effectiveRoleName = projectRole ? allRoles[projectRole]?.name : `Erf van Organisatie (${allRoles[orgRole]?.name})`;
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
                                            <p className="text-sm text-muted-foreground">{effectiveRoleName}</p>
                                        </div>
                                    </div>
                                    {isOwner ? (
                                        <span className="text-sm font-semibold">Eigenaar</span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {isLoading[member.id] && <Loader2 className="h-4 w-4 animate-spin" />}
                                            <Select
                                                value={projectRole || 'inherit'}
                                                onValueChange={(value) => handleRoleChange(member.id, value)}
                                                disabled={isLoading[member.id]}
                                            >
                                                <SelectTrigger className="w-[200px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="inherit">Erf van Organisatie</SelectItem>
                                                    {Object.entries(allRoles).filter(([key]) => key !== ROLE_OWNER).map(([roleId, roleDetails]) => (
                                                        <SelectItem key={roleId} value={roleId}>{roleDetails.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
