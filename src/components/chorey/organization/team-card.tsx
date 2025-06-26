
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users } from 'lucide-react';
import type { Team, User } from '@/lib/types';
import { ManageMembersPopover } from './manage-members-popover';

export function TeamCard({ team, usersInOrg }: { team: Team, usersInOrg: User[] }) {
    const members = useMemo(() => {
        return team.memberIds.map(id => usersInOrg.find(u => u.id === id)).filter(Boolean) as User[];
    }, [team.memberIds, usersInOrg]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/>{team.name}</CardTitle>
                    <CardDescription>{members.length} {members.length === 1 ? 'lid' : 'leden'}</CardDescription>
                </div>
                <ManageMembersPopover team={team} usersInOrg={usersInOrg} />
            </CardHeader>
            <CardContent>
                {members.length > 0 ? (
                    <TooltipProvider>
                        <div className="flex -space-x-2">
                            {members.map(member => (
                                <Tooltip key={member.id}>
                                    <TooltipTrigger asChild>
                                        <Avatar className="border-2 border-background">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{member.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </TooltipProvider>
                ) : (
                    <p className="text-sm text-muted-foreground">Dit team heeft nog geen leden.</p>
                )}
            </CardContent>
        </Card>
    );
}
