
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Shield, UserCheck, Plus, Briefcase, Users, Edit } from 'lucide-react';
import type { Team } from '@/lib/types';
import { PERMISSIONS, PERMISSIONS_DESCRIPTIONS } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { CreateOrganizationView } from '@/components/chorey/organization/create-organization-view';
import { ProjectDialog } from '@/components/chorey/organization/project-dialog';
import { ProjectCard } from '@/components/chorey/organization/project-card';
import { InviteMembersDialog } from '@/components/chorey/organization/invite-members-dialog';
import { MemberList } from '@/components/chorey/organization/member-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeamDialog } from '@/components/chorey/organization/team-dialog';
import { ManageMembersPopover } from '@/components/chorey/organization/manage-members-popover';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function OrganizationPage() {
    const { currentOrganization, loading: authLoading, currentUserPermissions, projects, teams, users: usersInOrg } = useAuth();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
    const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);


    if (authLoading) {
        return (
          <div className="flex h-full w-full items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }
    
    if (!currentOrganization) {
        return <CreateOrganizationView />;
    }
    
    const showRaci = currentOrganization.settings?.features?.raci !== false;
    const canViewRaci = currentUserPermissions.includes(PERMISSIONS.VIEW_AUDIT_LOG) && showRaci;
    const canManageRoles = currentUserPermissions.includes(PERMISSIONS.MANAGE_ROLES);
    const canInviteMembers = currentUserPermissions.includes(PERMISSIONS.MANAGE_MEMBERS);
    const canManageProjects = currentUserPermissions.includes(PERMISSIONS.MANAGE_PROJECTS);
    const canManageTeams = currentUserPermissions.includes(PERMISSIONS.MANAGE_TEAMS);

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="font-semibold text-lg md:text-2xl">Organisatie Overzicht</h1>
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span tabIndex={0}>
                                        <Button asChild variant="outline" disabled={!canViewRaci} className={cn(!canViewRaci && 'pointer-events-none')}>
                                            <Link href={canViewRaci ? "/dashboard/organization/raci" : "#"}>
                                                <UserCheck className="mr-2 h-4 w-4" /> RACI Matrix
                                            </Link>
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {!canViewRaci && <TooltipContent><p>{PERMISSIONS_DESCRIPTIONS.VIEW_AUDIT_LOG.name} permissie vereist.</p></TooltipContent>}
                            </Tooltip>
                        </TooltipProvider>

                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span tabIndex={0}>
                                        <Button asChild variant="outline" disabled={!canManageRoles} className={cn(!canManageRoles && 'pointer-events-none')}>
                                            <Link href={canManageRoles ? "/dashboard/organization/roles" : "#"}>
                                                <Shield className="mr-2 h-4 w-4" /> Rollen & Permissies
                                            </Link>
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {!canManageRoles && <TooltipContent><p>{PERMISSIONS_DESCRIPTIONS.MANAGE_ROLES.name} permissie vereist.</p></TooltipContent>}
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span tabIndex={0}>
                                        <Button variant="outline" disabled={!canInviteMembers} onClick={() => canInviteMembers && setIsInviteOpen(true)} className={cn(!canInviteMembers && 'pointer-events-none')}>
                                            <Plus className="mr-2 h-4 w-4" /> Leden Uitnodigen
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {!canInviteMembers && <TooltipContent><p>{PERMISSIONS_DESCRIPTIONS.MANAGE_MEMBERS.name} permissie vereist.</p></TooltipContent>}
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <Separator />

                <div className="grid gap-x-6 gap-y-12 lg:grid-cols-2">
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-semibold flex items-center gap-2"><Briefcase/> Projecten</h2>
                           <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span tabIndex={0}>
                                            <Button size="sm" disabled={!canManageProjects} onClick={() => canManageProjects && setIsProjectDialogOpen(true)} className={cn(!canManageProjects && 'pointer-events-none')}>
                                                <Plus className="mr-2 h-4 w-4" /> Nieuw Project
                                            </Button>
                                        </span>
                                    </TooltipTrigger>
                                    {!canManageProjects && <TooltipContent><p>{PERMISSIONS_DESCRIPTIONS.MANAGE_PROJECTS.name} permissie vereist.</p></TooltipContent>}
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                         {projects.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-1">
                                {projects.map(project => (
                                    <ProjectCard key={project.id} project={project} usersInOrg={usersInOrg} allTeams={teams} />
                                ))}
                            </div>
                        ) : (
                            <Card className="flex flex-col items-center justify-center py-12">
                                <CardHeader className="text-center">
                                    <CardTitle>Nog geen projecten</CardTitle>
                                    <CardDescription>Maak je eerste project aan om taken te groeperen.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span tabIndex={0}>
                                                    <Button disabled={!canManageProjects} onClick={() => canManageProjects && setIsProjectDialogOpen(true)} className={cn(!canManageProjects && 'pointer-events-none')}>
                                                        <Plus className="mr-2 h-4 w-4" /> Nieuw Project
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            {!canManageProjects && <TooltipContent><p>{PERMISSIONS_DESCRIPTIONS.MANAGE_PROJECTS.name} permissie vereist.</p></TooltipContent>}
                                        </Tooltip>
                                    </TooltipProvider>
                                </CardContent>
                            </Card>
                        )}

                         <div className="flex items-center justify-between mt-8">
                            <h2 className="text-xl font-semibold flex items-center gap-2"><Users /> Teams</h2>
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span tabIndex={0}>
                                            <Button size="sm" disabled={!canManageTeams} onClick={() => canManageTeams && setIsTeamDialogOpen(true)} className={cn(!canManageTeams && 'pointer-events-none')}>
                                                <Plus className="mr-2 h-4 w-4" /> Nieuw Team
                                            </Button>
                                        </span>
                                    </TooltipTrigger>
                                    {!canManageTeams && <TooltipContent><p>{PERMISSIONS_DESCRIPTIONS.MANAGE_TEAMS.name} permissie vereist.</p></TooltipContent>}
                                </Tooltip>
                            </TooltipProvider>
                         </div>
                         {teams.length > 0 ? (
                           <Card>
                             <CardContent className="p-4 space-y-4">
                               {teams.map(team => (
                                 <div key={team.id} className="flex items-center justify-between">
                                   <p className="font-medium">{team.name}</p>
                                   <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {(team.memberIds || []).map(id => usersInOrg.find(u => u.id === id)).filter(Boolean).map(member => (
                                            <Avatar key={member!.id} className="h-6 w-6 border-2 border-background">
                                                <AvatarImage src={member!.avatar} />
                                                <AvatarFallback>{member!.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        ))}
                                    </div>
                                    {canManageTeams && (
                                        <>
                                            <ManageMembersPopover team={team} usersInOrg={usersInOrg} />
                                            <TeamDialog team={team}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4"/></Button>
                                            </TeamDialog>
                                        </>
                                    )}
                                   </div>
                                 </div>
                               ))}
                             </CardContent>
                           </Card>
                         ) : (
                            <p className="text-sm text-muted-foreground">Er zijn nog geen teams aangemaakt.</p>
                         )}
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">Leden</h2>
                        <MemberList usersInOrg={usersInOrg} />
                    </div>
                </div>
            </div>
            <InviteMembersDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} organizationId={currentOrganization.id} />
            <ProjectDialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen} organizationId={currentOrganization.id} allTeams={teams} />
            <TeamDialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen} />
        </>
    );
}
