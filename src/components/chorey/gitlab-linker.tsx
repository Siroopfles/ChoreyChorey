'use client';

import { useState, useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Trash2, Search, Gitlab, GitMerge, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getGitLabItemFromUrl, searchGitLabItems } from '@/app/actions/gitlab.actions';
import { useAuth } from '@/contexts/auth-context';
import type { GitLabLink } from '@/lib/types';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useDebounce } from '@/hooks/use-debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function GitLabLinker() {
    const { control, getValues, setValue } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'gitlabLinks',
    });
    const { currentOrganization } = useAuth();
    const { toast } = useToast();
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState<string>('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [searchResults, setSearchResults] = useState<GitLabLink[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const isConfigured = !!currentOrganization?.settings?.gitlab?.projects?.length;
    const configuredProjects = currentOrganization?.settings?.gitlab?.projects || [];

    useEffect(() => {
        if (!debouncedSearchTerm || !selectedProject || !isConfigured || !currentOrganization) {
            setSearchResults([]);
            return;
        }

        const search = async () => {
            setIsSearching(true);
            const result = await searchGitLabItems(currentOrganization.id, selectedProject, debouncedSearchTerm);
            if (Array.isArray(result.items)) {
                setSearchResults(result.items);
            }
            setIsSearching(false);
        };

        search();
    }, [debouncedSearchTerm, selectedProject, isConfigured, currentOrganization]);

    const handleLinkItemFromUrl = async () => {
        if (!inputValue.trim() || !currentOrganization) return;
        setIsLoading(true);

        const result = await getGitLabItemFromUrl(currentOrganization.id, inputValue);
        if (result.error) {
            toast({ title: 'Fout bij koppelen', description: result.error, variant: 'destructive' });
        } else if (result.item) {
            appendLink(result.item);
        }
        setIsLoading(false);
        setInputValue('');
    };
    
    const appendLink = (item: GitLabLink) => {
        const currentLinks = getValues('gitlabLinks') || [];
        if (currentLinks.some((link: GitLabLink) => link.url === item.url)) {
            toast({ title: 'Al gekoppeld', description: 'Dit item is al aan de taak gekoppeld.', variant: 'default' });
        } else {
            append(item);
            toast({ title: 'Item gekoppeld!', description: `GitLab item #${item.iid} is gekoppeld.` });
        }
    };
    
    const handleSelectSearchResult = (item: GitLabLink) => {
        appendLink(item);
        setSearchOpen(false);
        setSearchTerm('');
    };

    if (!isConfigured) {
        return null;
    }

    return (
        <div>
            <Separator />
            <div className="space-y-4 pt-4">
                <Label>GitLab Koppelingen</Label>
                <div className="space-y-2">
                    {fields.map((field, index) => {
                        const item = field as unknown as GitLabLink & { id: string };
                        const Icon = item.type === 'merge_request' ? GitMerge : AlertCircle;
                        return (
                            <div key={item.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <Link href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" onClick={e => e.stopPropagation()}>
                                        <span className="text-muted-foreground">!{item.iid}</span> <span className="truncate">{item.title}</span>
                                    </Link>
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
                
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                     <div className="flex items-center gap-2">
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Selecteer project" />
                            </SelectTrigger>
                            <SelectContent>
                                {configuredProjects.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <PopoverAnchor asChild>
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setSearchOpen(true)}
                                placeholder="Zoek issue of MR..."
                                disabled={!selectedProject}
                            />
                        </PopoverAnchor>
                    </div>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Command>
                            <CommandList>
                                 {isSearching && <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin"/></div>}
                                 {!isSearching && searchResults.length === 0 && <CommandEmpty>Geen resultaten.</CommandEmpty>}
                                <CommandGroup>
                                    {searchResults.map((item) => (
                                        <CommandItem
                                            key={item.url}
                                            value={`${item.iid} ${item.title}`}
                                            onSelect={() => handleSelectSearchResult(item)}
                                            className="flex items-center gap-2"
                                        >
                                            <Gitlab className="h-4 w-4 text-orange-500" />
                                            <span>!{item.iid}</span>
                                            <span className="truncate">{item.title}</span>
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
                        placeholder="Of plak een GitLab issue/MR URL..."
                    />
                    <Button type="button" onClick={handleLinkItemFromUrl} disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Koppel URL'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
