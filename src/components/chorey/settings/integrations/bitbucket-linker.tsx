
'use client';

import { useState, useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Trash2, Search, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBitbucketItemFromUrl, searchBitbucketItems } from '@/app/actions/integrations/bitbucket.actions';
import { useAuth } from '@/contexts/user/auth-context';
import type { BitbucketLink } from '@/lib/types';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useDebounce } from '@/hooks/use-debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BitbucketIcon as ProviderIcon } from '@/components/chorey/common/provider-icons';


const BitbucketIcon = () => (
    <div className="h-4 w-4 shrink-0 text-blue-600">
        <ProviderIcon />
    </div>
);


export function BitbucketLinker() {
    const { control, getValues } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'bitbucketLinks',
    });
    const { currentOrganization } = useAuth();
    const { toast } = useToast();
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRepo, setSelectedRepo] = useState<string>('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [searchResults, setSearchResults] = useState<BitbucketLink[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const isConfigured = !!currentOrganization?.settings?.features?.bitbucket && !!currentOrganization?.settings?.bitbucket?.repos?.length;
    const configuredRepos = currentOrganization?.settings?.bitbucket?.repos || [];

    useEffect(() => {
        if (!debouncedSearchTerm || !selectedRepo || !isConfigured || !currentOrganization) {
            setSearchResults([]);
            return;
        }

        const search = async () => {
            setIsSearching(true);
            const { data, error } = await searchBitbucketItems(currentOrganization.id, selectedRepo, debouncedSearchTerm);
            if (data?.items) {
                setSearchResults(data.items);
            }
            if (error) {
                toast({ title: 'Fout bij zoeken', description: error, variant: 'destructive' });
            }
            setIsSearching(false);
        };

        search();
    }, [debouncedSearchTerm, selectedRepo, isConfigured, currentOrganization, toast]);

    const handleLinkItemFromUrl = async () => {
        if (!inputValue.trim() || !currentOrganization) return;
        setIsLoading(true);

        const { data, error } = await getBitbucketItemFromUrl(currentOrganization.id, inputValue);
        if (error) {
            toast({ title: 'Fout bij koppelen', description: error, variant: 'destructive' });
        } else if (data?.item) {
            appendLink(data.item);
        }
        setIsLoading(false);
        setInputValue('');
    };
    
    const appendLink = (item: BitbucketLink) => {
        const currentLinks = getValues('bitbucketLinks') || [];
        if (currentLinks.some((link: BitbucketLink) => link.url === item.url)) {
            toast({ title: 'Al gekoppeld', description: 'Dit item is al aan de taak gekoppeld.', variant: 'default' });
        } else {
            append(item);
            toast({ title: 'Item gekoppeld!', description: `Bitbucket issue #${item.id} is gekoppeld.` });
        }
    };
    
    const handleSelectSearchResult = (item: BitbucketLink) => {
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
                <Label>Bitbucket Koppelingen</Label>
                <div className="space-y-2">
                    {fields.map((field, index) => {
                        const item = field as unknown as BitbucketLink & { id: string };
                        return (
                            <div key={item.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <BitbucketIcon />
                                    <Link href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" onClick={e => e.stopPropagation()}>
                                        <span className="text-muted-foreground">#{item.id}</span> <span className="truncate">{item.title}</span>
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
                        <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Selecteer repo" />
                            </SelectTrigger>
                            <SelectContent>
                                {configuredRepos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <PopoverAnchor asChild>
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setSearchOpen(true)}
                                placeholder="Zoek issue..."
                                disabled={!selectedRepo}
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
                                            value={`${item.id} ${item.title}`}
                                            onSelect={() => handleSelectSearchResult(item)}
                                            className="flex items-center gap-2"
                                        >
                                            <AlertCircle className="h-4 w-4" />
                                            <span>#{item.id}</span>
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
                        placeholder="Of plak een Bitbucket issue URL..."
                    />
                    <Button type="button" onClick={handleLinkItemFromUrl} disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Koppel URL'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
