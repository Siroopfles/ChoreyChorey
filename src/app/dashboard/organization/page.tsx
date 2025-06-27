
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Shield, UserCheck, Plus } from 'lucide-react';
import type { Team } from '@/lib/types';
import { PERMISSIONS } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { CreateOrganizationView } from '@/components/chorey/organization/create-organization-view';
import { TeamDialog } from '@/components/chorey/organization/team-dialog';
import { TeamCard } from '@/components/chorey/organization/team-card';
import { InviteMembersDialog } from '@/components/chorey/organization/invite-members-dialog';
import { MemberList } from '@/components/chorey/organization/member-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';


export default function OrganizationPage() {
    const { currentOrganization, loading: authLoading, currentUserPermissions, teams } = useAuth();
    const { users: usersInOrg } = useTasks();
    const [loading, setLoading] = useState(true);

    const groupedTeams = useMemo(() => {
      if (!teams) return {};
      return teams.reduce((acc, team) => {
        const programName = team.program || 'Geen Programma';
        if (!acc[programName]) {
          acc[programName] = [];
        }
        acc[programName].push(team);
        return acc;
      }, {} as Record<string, Team[]>);
    }, [teams]);


    useEffect(() => {
        if (!currentOrganization) {
            setLoading(false);
            return;
        }
        setLoading(false);
    }, [currentOrganization]);
    
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

    if (loading) {
         return (
          <div className="flex h-full w-full items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }
    
    const canManageRaci = currentUserPermissions.includes(PERMISSIONS.VIEW_AUDIT_LOG); // Assuming similar level
    const canManageRoles = currentUserPermissions.includes(PERMISSIONS.MANAGE_ROLES);
    const canInviteMembers = currentUserPermissions.includes(PERMISSIONS.MANAGE_MEMBERS);
    const canManageTeams = currentUserPermissions.includes(PERMISSIONS.MANAGE_TEAMS);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-semibold text-lg md:text-2xl">Beheer voor {currentOrganization.name}</h1>
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
                    {canManageTeams && (
                      <TeamDialog organizationId={currentOrganization.id}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nieuw Team
                        </Button>
                      </TeamDialog>
                    )}
                </div>
            </div>

            <Separator />

            <div className="grid gap-x-6 gap-y-12 lg:grid-cols-2">
                <div className="space-y-8">
                    <h2 className="text-xl font-semibold">Teams</h2>
                     {teams.length > 0 ? (
                        Object.entries(groupedTeams).map(([program, programTeams]) => (
                            <div key={program} className="space-y-4">
                                <h3 className="text-lg font-semibold text-muted-foreground">{program}</h3>
                                <div className="grid gap-6 md:grid-cols-1">
                                    {programTeams.map(team => (
                                        <TeamCard key={team.id} team={team} usersInOrg={usersInOrg} />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <Card className="flex flex-col items-center justify-center py-12">
                            <CardHeader className="text-center">
                                <CardTitle>Nog geen teams</CardTitle>
                                <CardDescription>Maak je eerste team aan om leden te organiseren.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {canManageTeams && (
                                    <TeamDialog organizationId={currentOrganization.id}>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Nieuw Team
                                        </Button>
                                    </TeamDialog>
                                )}
                            </CardContent>
                        </Card>
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
