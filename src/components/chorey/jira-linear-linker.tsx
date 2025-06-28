
'use client';

import { useState, useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getJiraItemFromUrl, searchJiraItems } from '@/app/actions/jira.actions';
import { useAuth } from '@/contexts/auth-context';
import type { JiraLink } from '@/lib/types';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useDebounce } from '@/hooks/use-debounce';

const JiraIcon = ({ src }: { src: string }) => <img src={src} alt="Jira issue type" className="h-4 w-4 shrink-0" />;

// Renamed from JiraLinearLinker
export function JiraLinearLinker() {
    const { control, getValues, setValue } = useFormContext();
    const { fields: jiraFields, append: appendJira, remove: removeJira } = useFieldArray({ control, name: 'jiraLinks' });
    
    const { currentOrganization } = useAuth();
    const { toast } = useToast();
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Search state
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [searchResults, setSearchResults] = useState<JiraLink[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const isJiraConfigured = !!currentOrganization?.settings?.features?.jira;

    useEffect(() => {
        if (!debouncedSearchTerm || !isJiraConfigured || !currentOrganization) {
            setSearchResults([]);
            return;
        }

        const search = async () => {
            setIsSearching(true);
            const result = await searchJiraItems(currentOrganization.id, debouncedSearchTerm);
            if (Array.isArray(result)) {
                setSearchResults(result);
            }
            setIsSearching(false);
        };

        search();
    }, [debouncedSearchTerm, isJiraConfigured, currentOrganization]);

    const handleLinkItemFromUrl = async () => {
        if (!inputValue.trim() || !currentOrganization) return;
        setIsLoading(true);

        const result = await getJiraItemFromUrl(currentOrganization.id, inputValue);
        if (result.error) {
            toast({ title: 'Fout bij koppelen', description: result.error, variant: 'destructive' });
        } else if (result.item) {
            appendJiraLink(result.item);
        }
        setIsLoading(false);
        setInputValue('');
    };
    
    const appendJiraLink = (item: JiraLink) => {
        const currentLinks = getValues('jiraLinks') || [];
        if (currentLinks.some((link: JiraLink) => link.key === item.key)) {
            toast({ title: 'Al gekoppeld', description: `Jira issue ${item.key} is al gekoppeld.`, variant: 'default' });
        } else {
            appendJira(item);
            const currentKeys = getValues('jiraLinkKeys') || [];
            setValue('jiraLinkKeys', [...currentKeys, item.key]);
            toast({ title: 'Item gekoppeld!', description: `Jira issue ${item.key} is gekoppeld.` });
        }
    };
    
    const handleRemoveJira = (index: number) => {
      const linkToRemove = getValues(`jiraLinks.${index}`);
      const currentKeys = getValues('jiraLinkKeys') || [];
      setValue('jiraLinkKeys', currentKeys.filter((k: string) => k !== linkToRemove.key));
      removeJira(index);
    }

    const handleSelectSearchResult = (item: JiraLink) => {
        appendJiraLink(item);
        setSearchOpen(false);
        setSearchTerm('');
    };

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
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRemoveJira(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
                
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                     <div className="flex items-center gap-2">
                        <PopoverAnchor asChild>
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setSearchOpen(true)}
                                placeholder="Zoek Jira issue op trefwoord..."
                            />
                        </PopoverAnchor>
                        <Button type="button" variant="outline" size="icon" disabled>
                             <Search className="h-4 w-4"/>
                        </Button>
                    </div>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Command>
                            <CommandList>
                                 {isSearching && <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin"/></div>}
                                 {!isSearching && searchResults.length === 0 && <CommandEmpty>Geen resultaten.</CommandEmpty>}
                                <CommandGroup>
                                    {searchResults.map((item) => (
                                        <CommandItem
                                            key={item.key}
                                            value={item.key}
                                            onSelect={() => handleSelectSearchResult(item)}
                                            className="flex items-center gap-2"
                                        >
                                            <JiraIcon src={item.iconUrl} />
                                            <span>{item.key}</span>
                                            <span className="truncate">{item.summary}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <div className="flex items-center gap-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Of plak een Jira issue URL..."
                    />
                    <Button type="button" onClick={handleLinkItemFromUrl} disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Koppel URL'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
