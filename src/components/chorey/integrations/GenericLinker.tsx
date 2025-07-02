
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/user/auth-context';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useDebounce } from '@/hooks/use-debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define a generic type for the items
type LinkableItem = { [key: string]: any };

interface GenericLinkerProps<T extends LinkableItem> {
  linkerName: string;
  fieldArrayName: string;
  getUniqueKey: (item: T) => string;
  getDisplayId: (item: T) => string;
  searchFunction?: (orgId: string, repoOrProject: string, searchTerm: string) => Promise<{ data: { items: T[] } | null; error: string | null; }>;
  getItemFromUrlFunction: (orgId: string, url: string) => Promise<{ data: { item: T } | null; error: string | null; }>;
  renderLinkItem: (item: T) => React.ReactNode;
  renderSearchResult: (item: T, onSelect: (item: T) => void) => React.ReactNode;
  projectOrRepoConfig?: {
    label: string;
    placeholder: string;
    options: string[];
  };
  isConfigured: boolean;
  LinkerIcon: React.ElementType;
}

export function GenericLinker<T extends LinkableItem>({
  linkerName,
  fieldArrayName,
  getUniqueKey,
  getDisplayId,
  searchFunction,
  getItemFromUrlFunction,
  renderLinkItem,
  renderSearchResult,
  projectOrRepoConfig,
  isConfigured,
  LinkerIcon,
}: GenericLinkerProps<T>) {
  const { control, getValues, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldArrayName,
  });
  
  const denormalizedIdArrayName = `${fieldArrayName}Urls` || `${fieldArrayName}Keys`;
  const { fields: idFields, append: appendId, remove: removeId } = useFieldArray({
    control,
    name: denormalizedIdArrayName
  });


  const { currentOrganization } = useAuth();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchFunction || !debouncedSearchTerm || (projectOrRepoConfig && !selectedRepo)) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      if (!currentOrganization) return;
      setIsSearching(true);
      const { data, error } = await searchFunction(currentOrganization.id, selectedRepo, debouncedSearchTerm);
      if (data?.items) {
        setSearchResults(data.items);
      }
      if (error) {
        toast({ title: 'Fout bij zoeken', description: error, variant: 'destructive' });
      }
      setIsSearching(false);
    };

    search();
  }, [debouncedSearchTerm, selectedRepo, isConfigured, currentOrganization, toast, searchFunction, projectOrRepoConfig]);

  const appendLink = (item: T) => {
    const uniqueKey = getUniqueKey(item);
    const currentLinks = getValues(fieldArrayName) || [];
    if (currentLinks.some((link: T) => getUniqueKey(link) === uniqueKey)) {
      toast({ title: 'Al gekoppeld', description: `Dit ${linkerName} item is al aan de taak gekoppeld.`, variant: 'default' });
    } else {
      append(item);
      const denormalizedId = item.url || item.key;
      if (denormalizedId) {
          const currentIds = getValues(denormalizedIdArrayName) || [];
          setValue(denormalizedIdArrayName, [...currentIds, denormalizedId]);
      }
      toast({ title: 'Item gekoppeld!', description: `${linkerName} item ${getDisplayId(item)} is gekoppeld.` });
    }
  };

  const handleLinkItemFromUrl = async () => {
    if (!inputValue.trim() || !currentOrganization) return;
    setIsLoading(true);
    const { data, error } = await getItemFromUrlFunction(currentOrganization.id, inputValue);
    if (error) {
      toast({ title: 'Fout bij koppelen', description: error, variant: 'destructive' });
    } else if (data?.item) {
      appendLink(data.item);
    }
    setIsLoading(false);
    setInputValue('');
  };
  
  const handleSelectSearchResult = (item: T) => {
    appendLink(item);
    setSearchOpen(false);
    setSearchTerm('');
  };
  
  const handleRemove = (index: number) => {
    const linkToRemove = getValues(`${fieldArrayName}.${index}`);
    if (linkToRemove) {
        const uniqueKey = linkToRemove.url || linkToRemove.key;
        if(uniqueKey) {
            const currentIds = getValues(denormalizedIdArrayName) || [];
            setValue(denormalizedIdArrayName, currentIds.filter((k: string) => k !== uniqueKey));
        }
    }
    remove(index);
  }

  if (!isConfigured) {
    return null;
  }

  return (
    <div>
      <Separator />
      <div className="space-y-4 pt-4">
        <Label>{linkerName} Koppelingen</Label>
        <div className="space-y-2">
          {fields.map((field, index) => (
             <div key={field.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                {renderLinkItem(field as T & { id: string })}
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRemove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
          ))}
        </div>
        
        {searchFunction && (
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <div className="flex items-center gap-2">
              {projectOrRepoConfig && (
                <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={projectOrRepoConfig.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {projectOrRepoConfig.options.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <PopoverAnchor asChild>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={`Zoek ${linkerName} issue...`}
                  disabled={projectOrRepoConfig && !selectedRepo}
                />
              </PopoverAnchor>
            </div>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
              <Command>
                <CommandList>
                  {isSearching && <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin"/></div>}
                  {!isSearching && searchResults.length === 0 && <CommandEmpty>Geen resultaten.</CommandEmpty>}
                  <CommandGroup>
                    {searchResults.map((item) => renderSearchResult(item, handleSelectSearchResult))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Of plak een ${linkerName} URL...`}
          />
          <Button type="button" onClick={handleLinkItemFromUrl} disabled={isLoading || !inputValue.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Koppel URL'}
          </Button>
        </div>
      </div>
    </div>
  );
}
