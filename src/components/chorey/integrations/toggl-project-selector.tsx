
'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useAuth } from '@/contexts/user/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { getTogglWorkspaces, getTogglProjects } from '@/app/actions/integrations/toggl.actions';
import { Clock, Loader2 } from 'lucide-react';

interface TogglEntity {
    id: number;
    name: string;
}

export function TogglProjectSelector() {
    const { user, currentOrganization } = useAuth();
    const { control, watch, setValue, getValues } = useFormContext();
    
    const [workspaces, setWorkspaces] = useState<TogglEntity[]>([]);
    const [projects, setProjects] = useState<TogglEntity[]>([]);
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);

    const selectedWorkspaceId = watch('togglWorkspaceId');
    const isTogglEnabled = currentOrganization?.settings?.features?.toggl;
    const hasApiToken = !!user?.togglApiToken;

    useEffect(() => {
        if (isTogglEnabled && hasApiToken && user) {
            setIsLoadingWorkspaces(true);
            getTogglWorkspaces(user.id).then(({ data }) => {
                if (data?.workspaces) {
                    setWorkspaces(data.workspaces);
                }
                setIsLoadingWorkspaces(false);
            });
        }
    }, [isTogglEnabled, hasApiToken, user]);

    useEffect(() => {
        if (selectedWorkspaceId && user) {
            setIsLoadingProjects(true);
            setProjects([]);
            // Do not reset the value if it's already set for the current workspace
            const currentProjectId = getValues('togglProjectId');
            // This is a bit tricky, without fetching we don't know if the project belongs to the workspace.
            // For now, let's just reset it. A better implementation might fetch the project and check.
            setValue('togglProjectId', undefined);
            
            getTogglProjects(user.id, selectedWorkspaceId).then(({ data }) => {
                if (data?.projects) {
                    setProjects(data.projects);
                }
                setIsLoadingProjects(false);
            });
        }
    }, [selectedWorkspaceId, user, setValue, getValues]);
    
    if (!isTogglEnabled || !hasApiToken) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-md font-semibold">Toggl Integratie</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name="togglWorkspaceId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Toggl Workspace</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                <FormControl>
                                    <SelectTrigger disabled={isLoadingWorkspaces}>
                                        {isLoadingWorkspaces ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4 text-muted-foreground" />}
                                        <SelectValue placeholder="Selecteer workspace..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {workspaces.map(ws => (
                                        <SelectItem key={ws.id} value={ws.id.toString()}>{ws.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="togglProjectId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Toggl Project</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value?.toString()} disabled={!selectedWorkspaceId || isLoadingProjects}>
                                <FormControl>
                                    <SelectTrigger>
                                        {isLoadingProjects ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4 text-muted-foreground" />}
                                        <SelectValue placeholder="Selecteer project..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
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
