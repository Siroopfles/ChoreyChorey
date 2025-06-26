'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Team } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/firebase';
import { CreateOrganizationView } from '@/components/chorey/organization/create-organization-view';
import { CreateTeamDialog } from '@/components/chorey/organization/create-team-dialog';
import { TeamCard } from '@/components/chorey/organization/team-card';
import { InviteMembersDialog } from '@/components/chorey/organization/invite-members-dialog';
import { MemberList } from '@/components/chorey/organization/member-list';


export default function OrganizationPage() {
    const { currentOrganization, loading: authLoading, currentUserRole } = useAuth();
    const { users: usersInOrg } = useTasks();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentOrganization) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const q = query(collection(db, "teams"), where("organizationId", "==", currentOrganization.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
            setTeams(teamsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching teams:", error);
            setLoading(false);
        });

        return () => unsubscribe();
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
    
    const canManageMembers = currentUserRole === 'Owner' || currentUserRole === 'Admin';
    const canManageTeams = currentUserRole === 'Owner' || currentUserRole === 'Admin';

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-semibold text-lg md:text-2xl">Beheer voor {currentOrganization.name}</h1>
                <div className="flex items-center gap-2">
                    {canManageMembers && <InviteMembersDialog organizationId={currentOrganization.id} />}
                    {canManageTeams && <CreateTeamDialog organizationId={currentOrganization.id} />}
                </div>
            </div>

            <Separator />

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Teams</h2>
                    {teams.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-1">
                            {teams.map(team => (
                                <TeamCard key={team.id} team={team} usersInOrg={usersInOrg} />
                            ))}
                        </div>
                    ) : (
                        <Card className="flex flex-col items-center justify-center py-12">
                            <CardHeader className="text-center">
                                <CardTitle>Nog geen teams</CardTitle>
                                <CardDescription>Maak je eerste team aan om leden te organiseren.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {canManageTeams && <CreateTeamDialog organizationId={currentOrganization.id} />}
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
