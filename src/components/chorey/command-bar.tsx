'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTasks } from '@/contexts/task-context';
import { useToast } from '@/hooks/use-toast';
import { handleProcessCommand } from '@/app/actions';
import type { User } from '@/lib/types';

type CommandBarProps = {
    users: User[];
}

export default function CommandBar({ users }: CommandBarProps) {
    const [command, setCommand] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addTask, setSearchTerm } = useTasks();
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
            const { action, task, searchTerm, reasoning } = response.result;

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
            } else if (action === 'search' && searchTerm !== undefined) {
                setSearchTerm(searchTerm);
                toast({
                    title: 'Zoekresultaten',
                    description: `Taken gefilterd op: "${searchTerm}".`,
                });
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
