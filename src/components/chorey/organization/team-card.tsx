
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Edit } from 'lucide-react';
import type { Team, User } from '@/lib/types';
import { ManageMembersPopover } from './manage-members-popover';
import { TeamDialog } from './team-dialog';
import { Button } from '@/components/ui/button';
import { PERMISSIONS } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';

export function TeamCard({ team, usersInOrg }: { team: Team, usersInOrg: User[] }) {
    const { currentUserPermissions } = useAuth();
    const canManageTeams = currentUserPermissions.includes(PERMISSIONS.MANAGE_TEAMS);

    const members = useMemo(() => {
        return team.memberIds.map(id => usersInOrg.find(u => u.id === id)).filter(Boolean) as User[];
    }, [team.memberIds, usersInOrg]);
    

    return (
        <div key={team.id} className="flex items-center justify-between">
            <div className='flex items-center gap-4'>
                <div className="flex -space-x-2">
                    <TooltipProvider>
                    {(members || []).map(member => (
                        <Tooltip key={member!.id}>
                            <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 border-2 border-background">
                                    <AvatarImage src={member!.avatar} />
                                    <AvatarFallback>{member!.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{member.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    </TooltipProvider>
                </div>
                <p className="font-medium">{team.name}</p>
            </div>
            {canManageTeams && (
                <div className="flex items-center gap-2">
                    <ManageMembersPopover team={team} usersInOrg={usersInOrg} />
                    <TeamDialog team={team}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4"/></Button>
                    </TeamDialog>
                </div>
            )}
        </div>
    );
}
