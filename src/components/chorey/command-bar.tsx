
'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { handleProcessCommand } from '@/app/actions';

export default function CommandBar() {
    const [command, setCommand] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user, currentOrganization } = useAuth();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!command.trim() || !user || !currentOrganization) return;

        setIsLoading(true);

        const response = await handleProcessCommand(command, user.id, currentOrganization.id, user.name);

        if (response.error) {
            toast({
                title: 'AI Fout',
                description: response.error,
                variant: 'destructive',
            });
        } else if (response.result) {
            toast({
                title: 'AI Assistent',
                description: response.result,
            });
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
                placeholder="Zoek, maak of wijzig een taak..."
                className="pl-8 w-full bg-sidebar-accent border-sidebar-border"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                disabled={isLoading || !user || !currentOrganization}
            />
        </form>
    );
}
