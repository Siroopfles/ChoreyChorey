
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, EyeOff, Globe, Share2, Edit, Medal, Loader2 } from 'lucide-react';
import type { Team, User } from '@/lib/types';
import { ManageMembersPopover } from './manage-members-popover';
import { TeamDialog } from './team-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/lib/types';
import { completeProject } from '@/app/actions/organization.actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


export function TeamCard({ team, usersInOrg }: { team: Team, usersInOrg: User[] }) {
    const { toast } = useToast();
    const { user, currentUserPermissions } = useAuth();
    const [isCompleting, setIsCompleting] = useState(false);
    
    const canManageTeams = currentUserPermissions.includes(PERMISSIONS.MANAGE_TEAMS);

    const members = useMemo(() => {
        return team.memberIds.map(id => usersInOrg.find(u => u.id === id)).filter(Boolean) as User[];
    }, [team.memberIds, usersInOrg]);
    
    const handleShare = () => {
        const link = `${window.location.origin}/public/team/${team.id}`;
        navigator.clipboard.writeText(link);
        toast({
            title: 'Link Gekopieerd!',
            description: 'De openbare link naar dit teambord is gekopieerd.',
        });
    }

    const handleCompleteProject = async () => {
        if (!user) return;
        setIsCompleting(true);
        const result = await completeProject(team.id, team.organizationId, user.id);
        if (result.error) {
            toast({ title: "Fout", description: result.error, variant: 'destructive' });
        } else {
            toast({ title: "Project Voltooid!", description: result.message });
        }
        setIsCompleting(false);
    };


    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary"/>
                        {team.name}
                        {team.isSensitive && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger><EyeOff className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                                    <TooltipContent><p>Dit is een gevoelig team.</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {team.isPublic && (
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger><Globe className="h-4 w-4 text-blue-500" /></TooltipTrigger>
                                    <TooltipContent><p>Dit team is publiek deelbaar.</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                         {canManageTeams && (
                            <AlertDialog>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><Medal className="h-4 w-4 text-amber-500"/></Button>
                                            </AlertDialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Project Voltooien</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Weet u het zeker?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Dit zal het project '{team.name}' als voltooid markeren en een prestatie-badge toekennen aan alle teamleden. Deze actie kan niet ongedaan worden gemaakt.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleCompleteProject} disabled={isCompleting}>
                                            {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Ja, voltooi project
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        <TeamDialog organizationId={team.organizationId} team={team}>
                           <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4"/></Button>
                        </TeamDialog>
                        <ManageMembersPopover team={team} usersInOrg={usersInOrg} />
                    </div>
                </div>
                <CardDescription>{members.length} {members.length === 1 ? 'lid' : 'leden'}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
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
                                    <TooltipContent><p>{member.name}</p></TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </TooltipProvider>
                ) : (
                    <p className="text-sm text-muted-foreground">Dit team heeft nog geen leden.</p>
                )}
                 {team.isPublic && <Button variant="outline" size="sm" onClick={handleShare}><Share2 className="mr-2 h-4 w-4"/> Deel Link</Button>}
            </CardContent>
        </Card>
    );
}
