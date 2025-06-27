
'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { getClockifyWorkspaces, getClockifyProjects } from '@/app/actions/clockify.actions';
import { Loader2 } from 'lucide-react';

interface ClockifyEntity {
    id: string;
    name: string;
}

const ClockifyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mr-2 h-4 w-4 text-muted-foreground">
        <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path><path d="M13 7h-2v5.414l3.293 3.293 1.414-1.414L13 11.586z"></path>
    </svg>
);

export function ClockifyProjectSelector() {
    const { user, currentOrganization } = useAuth();
    const { control, watch, setValue } = useFormContext();
    
    const [workspaces, setWorkspaces] = useState<ClockifyEntity[]>([]);
    const [projects, setProjects] = useState<ClockifyEntity[]>([]);
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);

    const selectedWorkspaceId = watch('clockifyWorkspaceId');
    const isClockifyEnabled = currentOrganization?.settings?.features?.clockify;
    const hasApiToken = !!user?.clockifyApiToken;

    useEffect(() => {
        if (isClockifyEnabled && hasApiToken && user) {
            setIsLoadingWorkspaces(true);
            getClockifyWorkspaces(user.id).then(result => {
                if (result.workspaces) {
                    setWorkspaces(result.workspaces);
                }
                setIsLoadingWorkspaces(false);
            });
        }
    }, [isClockifyEnabled, hasApiToken, user]);

    useEffect(() => {
        if (selectedWorkspaceId && user) {
            setIsLoadingProjects(true);
            setProjects([]);
            setValue('clockifyProjectId', undefined);
            
            getClockifyProjects(user.id, selectedWorkspaceId).then(result => {
                if (result.projects) {
                    setProjects(result.projects);
                }
                setIsLoadingProjects(false);
            });
        }
    }, [selectedWorkspaceId, user, setValue]);
    
    if (!isClockifyEnabled || !hasApiToken) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-md font-semibold">Clockify Integratie</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name="clockifyWorkspaceId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Clockify Workspace</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger disabled={isLoadingWorkspaces}>
                                        {isLoadingWorkspaces ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClockifyIcon />}
                                        <SelectValue placeholder="Selecteer workspace..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {workspaces.map(ws => (
                                        <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="clockifyProjectId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Clockify Project</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedWorkspaceId || isLoadingProjects}>
                                <FormControl>
                                    <SelectTrigger>
                                        {isLoadingProjects ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClockifyIcon />}
                                        <SelectValue placeholder="Selecteer project..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}
