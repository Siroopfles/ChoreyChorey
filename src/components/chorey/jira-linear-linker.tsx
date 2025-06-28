
'use client';

import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getJiraItemFromUrl } from '@/app/actions/jira.actions';
import { useAuth } from '@/contexts/auth-context';
import type { JiraLink } from '@/lib/types';
import Link from 'next/link';

const JiraIcon = ({ src }: { src: string }) => <img src={src} alt="Jira issue type" className="h-4 w-4 shrink-0" />;

export function JiraLinearLinker() {
    const { control, getValues } = useFormContext();
    const { fields: jiraFields, append: appendJira, remove: removeJira } = useFieldArray({ control, name: 'jiraLinks' });
    
    const { currentOrganization } = useAuth();
    const { toast } = useToast();
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLinkItem = async () => {
        if (!inputValue.trim() || !currentOrganization) return;
        setIsLoading(true);

        const isJira = inputValue.includes('/browse/');
        
        if (isJira) {
            if (!currentOrganization.settings?.features?.jira) {
                toast({ title: 'Integratie uitgeschakeld', description: 'Jira integratie is niet ingeschakeld voor deze organisatie.', variant: 'destructive' });
                setIsLoading(false);
                return;
            }

            const result = await getJiraItemFromUrl(currentOrganization.id, inputValue);
            if (result.error) {
                toast({ title: 'Fout bij koppelen', description: result.error, variant: 'destructive' });
            } else if (result.item) {
                const currentLinks = getValues('jiraLinks') || [];
                if (currentLinks.some((link: JiraLink) => link.url === result.item!.url)) {
                    toast({ title: 'Al gekoppeld', description: 'Dit Jira issue is al gekoppeld.', variant: 'default' });
                } else {
                    appendJira(result.item);
                    toast({ title: 'Item gekoppeld!', description: `Jira issue ${result.item.key} is gekoppeld.` });
                }
                setInputValue('');
            }
        } else {
            toast({ title: 'URL niet herkend', description: 'Plak een geldige Jira issue URL.', variant: 'destructive' });
        }
        
        setIsLoading(false);
    };

    const isJiraConfigured = !!currentOrganization?.settings?.features?.jira;

    if (!isJiraConfigured) {
        return null;
    }

    return (
        <div>
            <Separator />
            <div className="space-y-4 pt-4">
                <Label>Jira Koppelingen</Label>
                <div className="space-y-2">
                    {jiraFields.map((field, index) => {
                        const item = field as unknown as JiraLink & { id: string };
                        return (
                            <div key={item.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <JiraIcon src={item.iconUrl} />
                                    <Link href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" onClick={e => e.stopPropagation()}>
                                        <span className="text-muted-foreground">{item.key}</span> <span className="truncate">{item.summary}</span>
                                    </Link>
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeJira(index)}>
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
                        placeholder="Plak Jira issue URL..."
                    />
                    <Button type="button" onClick={handleLinkItem} disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Koppel'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
