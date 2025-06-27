'use client';

import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Trash2, Github, GitPullRequest, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getGithubItemFromUrl } from '@/app/actions/github.actions';
import { useAuth } from '@/contexts/auth-context';
import type { GitHubLink } from '@/lib/types';
import Link from 'next/link';

export function GitHubLinker() {
    const { control, getValues } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'githubLinks',
    });
    const { currentOrganization } = useAuth();
    const { toast } = useToast();
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLinkItem = async () => {
        if (!inputValue.trim() || !currentOrganization) return;
        setIsLoading(true);

        const result = await getGithubItemFromUrl(currentOrganization.id, inputValue);

        if (result.error) {
            toast({ title: 'Fout bij koppelen', description: result.error, variant: 'destructive' });
        } else if (result.item) {
            const currentLinks = getValues('githubLinks') || [];
            if (currentLinks.some((link: GitHubLink) => link.url === result.item.url)) {
                toast({ title: 'Al gekoppeld', description: 'Dit item is al aan de taak gekoppeld.', variant: 'default' });
            } else {
                append(result.item);
                toast({ title: 'Item gekoppeld!', description: `GitHub item #${result.item.number} is gekoppeld.` });
            }
            setInputValue('');
        }
        setIsLoading(false);
    };

    const isConfigured = !!currentOrganization?.settings?.github?.owner;

    if (!isConfigured) {
        return null; // Don't render if not configured
    }

    return (
        <div>
            <Separator />
            <div className="space-y-4 pt-4">
                <Label>GitHub Koppelingen</Label>
                <div className="space-y-2">
                    {fields.map((field, index) => {
                        const item = field as unknown as GitHubLink & { id: string };
                        const Icon = item.type === 'pull-request' ? GitPullRequest : AlertCircle;
                        return (
                            <div key={item.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <Link href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" onClick={e => e.stopPropagation()}>
                                        <span className="text-muted-foreground">#{item.number}</span> <span className="truncate">{item.title}</span>
                                    </Link>
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Plak GitHub issue/PR URL..."
                    />
                    <Button type="button" onClick={handleLinkItem} disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Koppel'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
