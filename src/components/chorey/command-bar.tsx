'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTasks } from '@/contexts/task-context';
import { useToast } from '@/hooks/use-toast';
import { handleProcessCommand } from '@/app/actions';
import type { User, Label, Filters } from '@/lib/types';

type CommandBarProps = {
    users: User[];
}

export default function CommandBar({ users }: CommandBarProps) {
    const [command, setCommand] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addTask, setSearchTerm, setFilters, clearFilters } = useTasks();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!command.trim()) return;

        setIsLoading(true);

        const response = await handleProcessCommand(command);

        if (response.error) {
            toast({
                title: 'AI Fout',
                description: response.error,
                variant: 'destructive',
            });
        } else if (response.result) {
            const { action, task, searchParameters, reasoning } = response.result;

            if (action === 'create' && task) {
                const assignee = users.find(u => u.name.toLowerCase() === task.assignee?.toLowerCase());
                
                addTask({
                    ...task,
                    assigneeId: assignee?.id,
                    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
                });

                toast({
                    title: 'Taak Aangemaakt!',
                    description: `Taak "${task.title}" is aangemaakt.`,
                });
            } else if (action === 'search' && searchParameters) {
                clearFilters();

                if (Object.keys(searchParameters).length === 0) {
                     toast({
                        title: 'Filters gewist',
                        description: 'Alle taken worden weergegeven.',
                    });
                } else {
                    const { term, priority, assignee: assigneeName, labels } = searchParameters;
                    
                    const newFilters: Partial<Filters> = {};

                    if (priority) newFilters.priority = priority;
                    if (labels) newFilters.labels = labels as Label[];
                    if (assigneeName) {
                        const foundUser = users.find(u => u.name.toLowerCase().includes(assigneeName.toLowerCase()));
                        if (foundUser) newFilters.assigneeId = foundUser.id;
                    }

                    setFilters(newFilters);
                    setSearchTerm(term || '');

                    const descriptionParts = [];
                    if (term) descriptionParts.push(`Tekst: "${term}"`);
                    if (newFilters.priority) descriptionParts.push(`Prioriteit: ${newFilters.priority}`);
                    if (newFilters.assigneeId) descriptionParts.push(`Toegewezen: ${users.find(u => u.id === newFilters.assigneeId)?.name}`);
                    if (newFilters.labels?.length) descriptionParts.push(`Labels: ${newFilters.labels.join(', ')}`);

                    toast({
                        title: 'Zoekopdracht uitgevoerd',
                        description: descriptionParts.join('; ') || 'Filters toegepast.',
                    });
                }
            } else {
                toast({
                    title: 'Commando niet begrepen',
                    description: reasoning,
                    variant: 'destructive',
                });
            }
        }

        setCommand('');
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            {isLoading ? (
                <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            )}
            <Input
                type="search"
                placeholder="Zoek of maak een taak aan..."
                className="pl-8 w-full bg-sidebar-accent border-sidebar-border"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                disabled={isLoading}
            />
        </form>
    );
}
