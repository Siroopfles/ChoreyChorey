

'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, EyeOff, Globe, Share2, Edit, Medal, Loader2, Briefcase, UserPlus, Pin, Shield } from 'lucide-react';
import type { Team, User, Project, Task } from '@/lib/types';
import { ProjectDialog } from './project-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/lib/types';
import { completeProject, toggleProjectPin } from '@/app/actions/project.actions';
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
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { InviteGuestDialog } from './invite-guest-dialog';
import { PermissionProtectedButton } from '@/components/ui/permission-protected-button';
import { ManageProjectAccessDialog } from './manage-project-access-dialog';
import { ShareProjectDialog } from './ShareProjectDialog';


export function ProjectCard({ project, usersInOrg, allTeams, allTasks }: { project: Project, usersInOrg: User[], allTeams: Team[], allTasks: Task[] }) {
    const { toast } = useToast();
    const { user, currentOrganization, currentUserPermissions } = useAuth();
    const [isCompleting, setIsCompleting] = useState(false);
    const [isGuestInviteOpen, setIsGuestInviteOpen] = useState(false);
    const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
    const [isPinning, setIsPinning] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    
    const canInviteGuests = currentUserPermissions.includes(PERMISSIONS.MANAGE_MEMBERS);
    const canSharePublicly = currentOrganization?.settings?.features?.publicSharing !== false;

    const assignedTeams = useMemo(() => {
        return (project.teamIds || []).map(id => allTeams.find(t => t.id === id)).filter(Boolean) as Team[];
    }, [project.teamIds, allTeams]);
    
    const { totalCostOrHours, budgetProgress } = useMemo(() => {
        if (!project.budget || project.budget === 0) {
            return { totalCostOrHours: 0, budgetProgress: 0 };
        }
        const total = allTasks
            .filter(t => t.projectId === project.id)
            .reduce((sum, task) => sum + (task.cost || 0), 0);
        
        return {
            totalCostOrHours: total,
            budgetProgress: (total / project.budget) * 100
        };
    }, [allTasks, project]);

    const handleCompleteProject = async () => {
        if (!user) return;
        setIsCompleting(true);
        const result = await completeProject(project.id, project.organizationId, user.id);
        if (result.error) {
            toast({ title: "Fout", description: result.error, variant: 'destructive' });
        } else {
            toast({ title: "Project Voltooid!", description: result.message });
        }
        setIsCompleting(false);
    };

    const handlePinToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        setIsPinning(true);
        await toggleProjectPin(project.id, project.organizationId, user.id, !project.pinned);
        setIsPinning(false);
        toast({ title: `Project ${!project.pinned ? 'vastgepind' : 'losgemaakt'}.` });
    }


    return (
        <>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary"/>
                        {project.name}
                        {project.isSensitive && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger><EyeOff className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                                    <TooltipContent><p>Dit is een gevoelig project.</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {project.isPublic && (
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger><Globe className="h-4 w-4 text-blue-500" /></TooltipTrigger>
                                    <TooltipContent><p>Dit project is publiek deelbaar.</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <PermissionProtectedButton
                            requiredPermission={PERMISSIONS.MANAGE_PROJECTS}
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => setIsShareOpen(true)}
                            manualDisableCondition={!canSharePublicly}
                            manualDisableTooltip="Publiek delen is uitgeschakeld in de organisatie-instellingen."
                        >
                            <Share2 className="h-4 w-4 text-blue-500"/>
                        </PermissionProtectedButton>
                        <PermissionProtectedButton
                            requiredPermission={PERMISSIONS.MANAGE_PROJECT_ROLES}
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => setIsAccessDialogOpen(true)}
                        >
                            <Shield className="h-4 w-4" />
                        </PermissionProtectedButton>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PermissionProtectedButton
                                        requiredPermission={PERMISSIONS.PIN_ITEMS}
                                        variant="ghost" size="icon" className="h-8 w-8"
                                        onClick={handlePinToggle}
                                        disabled={isPinning}
                                    >
                                        {isPinning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pin className={cn("h-4 w-4", project.pinned && "fill-current text-primary")} />}
                                    </PermissionProtectedButton>
                                </TooltipTrigger>
                                <TooltipContent><p>{project.pinned ? 'Project losmaken' : 'Project vastpinnen'}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                         {canInviteGuests && (
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsGuestInviteOpen(true)}><UserPlus className="h-4 w-4 text-muted-foreground"/></Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Nodig Gast uit</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                         )}
                         <AlertDialog>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                            <PermissionProtectedButton 
                                                requiredPermission={PERMISSIONS.MANAGE_PROJECTS}
                                                variant="ghost" size="icon" className="h-8 w-8"
                                            >
                                                <Medal className="h-4 w-4 text-amber-500"/>
                                            </PermissionProtectedButton>
                                        </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Project Voltooien</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Weet u het zeker?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Dit zal het project '{project.name}' als voltooid markeren en een prestatie-badge toekennen aan alle leden van de toegewezen teams. Deze actie kan niet ongedaan worden gemaakt.
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
                        <ProjectDialog organizationId={project.organizationId} project={project} allTeams={allTeams}>
                           <PermissionProtectedButton requiredPermission={PERMISSIONS.MANAGE_PROJECTS} variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4"/>
                           </PermissionProtectedButton>
                        </ProjectDialog>
                    </div>
                </div>
                <CardDescription>{project.program || 'Geen programma'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {project.budget && project.budgetType && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-semibold">Budget</span>
                            <span>
                                {project.budgetType === 'amount' ? '€' : ''}
                                {totalCostOrHours.toLocaleString()} / {project.budget.toLocaleString()}
                                {project.budgetType === 'hours' ? ' uur' : ''}
                            </span>
                        </div>
                        <Progress value={budgetProgress} className={cn(budgetProgress > 100 && '[&>div]:bg-destructive')} />
                    </div>
                )}
                <div className="flex justify-between items-center">
                    {assignedTeams.length > 0 ? (
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{assignedTeams.map(t => t.name).join(', ')}</span>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Geen teams toegewezen.</p>
                    )}
                </div>
            </CardContent>
        </Card>
        <ShareProjectDialog open={isShareOpen} onOpenChange={setIsShareOpen} project={project} />
        <InviteGuestDialog open={isGuestInviteOpen} onOpenChange={setIsGuestInviteOpen} projectId={project.id} projectName={project.name} />
        <ManageProjectAccessDialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen} project={project} />
        </>
    );
}
