

'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/user/auth-context';
import { useOrganization } from '@/contexts/system/organization-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Shield, UserCheck, Plus, Briefcase, Users, Edit } from 'lucide-react';
import type { Team } from '@/lib/types';
import { PERMISSIONS } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { CreateOrganizationView } from '@/components/chorey/organization/create-organization-view';
import { ProjectDialog } from '@/components/chorey/organization/project-dialog';
import { ProjectCard } from '@/components/chorey/organization/project-card';
import { InviteMembersDialog } from '@/components/chorey/organization/invite-members-dialog';
import { MemberList } from '@/components/chorey/organization/member-list';
import { TeamDialog } from '@/components/chorey/organization/team-dialog';
import { useTasks } from '@/contexts/feature/task-context';
import { PermissionProtectedButton } from '@/components/ui/permission-protected-button';
import { TeamCard } from '@/components/chorey/organization/team-card';

export default function OrganizationPage() {
    const { loading: authLoading } = useAuth();
    const { currentOrganization, currentUserPermissions, projects, teams, users: usersInOrg, loading: orgLoading } = useOrganization();
    const { tasks, loading: tasksLoading } = useTasks();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
    const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);


    if (authLoading || tasksLoading || orgLoading) {
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

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="font-semibold text-lg md:text-2xl">Organisatie Overzicht</h1>
                    <div className="flex items-center gap-2">
                        <PermissionProtectedButton
                            requiredPermission={PERMISSIONS.VIEW_AUDIT_LOG}
                            variant="outline"
                            href="/dashboard/team-organization/organization/raci"
                            manualDisableCondition={!showRaci}
                            manualDisableTooltip="De RACI Matrix feature is uitgeschakeld voor deze organisatie."
                        >
                            <UserCheck className="mr-2 h-4 w-4" /> RACI Matrix
                        </PermissionProtectedButton>
                        
                        <PermissionProtectedButton
                            requiredPermission={PERMISSIONS.MANAGE_ROLES}
                            variant="outline"
                            href="/dashboard/team-organization/organization/roles"
                        >
                            <Shield className="mr-2 h-4 w-4" /> Rollen & Permissies
                        </PermissionProtectedButton>

                        <PermissionProtectedButton
                            requiredPermission={PERMISSIONS.MANAGE_MEMBERS}
                            variant="outline"
                            onClick={() => setIsInviteOpen(true)}
                        >
                             <Plus className="mr-2 h-4 w-4" /> Leden Uitnodigen
                        </PermissionProtectedButton>
                    </div>
                </div>

                <Separator />

                <div className="grid gap-x-6 gap-y-12 lg:grid-cols-2">
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-semibold flex items-center gap-2"><Briefcase/> Projecten</h2>
                           <PermissionProtectedButton
                                requiredPermission={PERMISSIONS.MANAGE_PROJECTS}
                                size="sm"
                                onClick={() => setIsProjectDialogOpen(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Nieuw Project
                            </PermissionProtectedButton>
                        </div>
                         {(projects || []).length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-1">
                                {projects.map(project => (
                                    <ProjectCard key={project.id} project={project} usersInOrg={usersInOrg} allTeams={teams} allTasks={tasks} />
                                ))}
                            </div>
                        ) : (
                            <Card className="flex flex-col items-center justify-center py-12">
                                <CardHeader className="text-center">
                                    <CardTitle>Nog geen projecten</CardTitle>
                                    <CardDescription>Maak je eerste project aan om taken te groeperen.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                     <PermissionProtectedButton
                                        requiredPermission={PERMISSIONS.MANAGE_PROJECTS}
                                        onClick={() => setIsProjectDialogOpen(true)}
                                     >
                                        <Plus className="mr-2 h-4 w-4" /> Nieuw Project
                                     </PermissionProtectedButton>
                                </CardContent>
                            </Card>
                        )}

                         <div className="flex items-center justify-between mt-8">
                            <h2 className="text-xl font-semibold flex items-center gap-2"><Users /> Teams</h2>
                             <PermissionProtectedButton
                                requiredPermission={PERMISSIONS.MANAGE_TEAMS}
                                size="sm"
                                onClick={() => setIsTeamDialogOpen(true)}
                             >
                                <Plus className="mr-2 h-4 w-4" /> Nieuw Team
                             </PermissionProtectedButton>
                         </div>
                         {(teams || []).length > 0 ? (
                           <Card>
                             <CardContent className="p-4 space-y-2">
                               {teams.map(team => (
                                <TeamCard key={team.id} team={team} usersInOrg={usersInOrg} />
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
