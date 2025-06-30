
'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { getClockifyWorkspaces, getClockifyProjects } from '@/app/actions/clockify.actions';
import { Loader2 } from 'lucide-react';
import { ClockifyIcon as ProviderIcon } from './provider-icons';

interface ClockifyEntity {
    id: string;
    name: string;
}

const ClockifyIcon = () => (
    <div className="mr-2 h-4 w-4 text-muted-foreground">
        <ProviderIcon />
    </div>
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
            getClockifyWorkspaces(user.id).then(({ data }) => {
                if (data?.workspaces) {
                    setWorkspaces(data.workspaces);
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
            
            getClockifyProjects(user.id, selectedWorkspaceId).then(({ data }) => {
                if (data?.projects) {
                    setProjects(data.projects);
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
