
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
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
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeamDialog } from '@/components/chorey/organization/team-dialog';
import { ManageMembersPopover } from '@/components/chorey/organization/manage-members-popover';

export default function OrganizationPage() {
    const { currentOrganization, loading: authLoading, currentUserPermissions, projects, teams } = useAuth();
    const { users: usersInOrg } = useTasks();

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
    
    const canManageRaci = currentUserPermissions.includes(PERMISSIONS.VIEW_AUDIT_LOG);
    const canManageRoles = currentUserPermissions.includes(PERMISSIONS.MANAGE_ROLES);
    const canInviteMembers = currentUserPermissions.includes(PERMISSIONS.MANAGE_MEMBERS);
    const canManageProjects = currentUserPermissions.includes(PERMISSIONS.MANAGE_PROJECTS);
    const canManageTeams = currentUserPermissions.includes(PERMISSIONS.MANAGE_TEAMS);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-semibold text-lg md:text-2xl">Organisatie Overzicht</h1>
                <div className="flex items-center gap-2">
                    {canManageRaci && (
                      <Button asChild variant="outline">
                        <Link href="/dashboard/organization/raci">
                          <UserCheck className="mr-2 h-4 w-4" /> RACI Matrix
                        </Link>
                      </Button>
                    )}
                    {canManageRoles && (
                      <Button asChild variant="outline">
                        <Link href="/dashboard/organization/roles">
                          <Shield className="mr-2 h-4 w-4" /> Rollen & Permissies
                        </Link>
                      </Button>
                    )}
                    {canInviteMembers && <InviteMembersDialog organizationId={currentOrganization.id} />}
                </div>
            </div>

            <Separator />

            <div className="grid gap-x-6 gap-y-12 lg:grid-cols-2">
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold flex items-center gap-2"><Briefcase/> Projecten</h2>
                       {canManageProjects && (
                         <ProjectDialog organizationId={currentOrganization.id} allTeams={teams}>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Nieuw Project
                            </Button>
                        </ProjectDialog>
                       )}
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
                                {canManageProjects && (
                                    <ProjectDialog organizationId={currentOrganization.id} allTeams={teams}>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Nieuw Project
                                        </Button>
                                    </ProjectDialog>
                                )}
                            </CardContent>
                        </Card>
                    )}

                     <div className="flex items-center justify-between mt-8">
                        <h2 className="text-xl font-semibold flex items-center gap-2"><Users /> Teams</h2>
                         {canManageTeams && (
                            <TeamDialog>
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nieuw Team
                                </Button>
                            </TeamDialog>
                        )}
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
    );
}
