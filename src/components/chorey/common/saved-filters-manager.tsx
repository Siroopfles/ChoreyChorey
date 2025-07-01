
'use client';

import { useState } from 'react';
import { useFilters } from '@/contexts/system/filter-context';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { manageSavedFilter } from '@/app/actions/core/filter.actions';
import { Save, Star, Trash2, Loader2 } from 'lucide-react';
import type { SavedFilter } from '@/lib/types';
import { PERMISSIONS } from '@/lib/types';

export function SavedFiltersManager() {
  const { filters, setFilters, activeFilterCount } = useFilters();
  const { currentOrganization, user, refreshUser, currentUserPermissions } = useAuth();
  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const savedFilters = currentOrganization?.settings?.savedFilters || [];
  
  const canDelete = (filter: SavedFilter) => {
    if (!user) return false;
    return filter.creatorId === user.id || currentUserPermissions.includes(PERMISSIONS.MANAGE_SAVED_FILTERS);
  }

  const handleSave = async () => {
    if (!filterName.trim() || !user || !currentOrganization) return;
    setIsSaving(true);
    const result = await manageSavedFilter(currentOrganization.id, user.id, 'save', {
      name: filterName,
      filters: filters,
    });
    setIsSaving(false);
    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Filter opgeslagen!', description: `Filter '${filterName}' is opgeslagen.` });
      await refreshUser(); // To get the new list of filters
      setPopoverOpen(false);
      setFilterName('');
    }
  };
  
  const handleDelete = async (filterId: string) => {
    if (!user || !currentOrganization) return;
    const result = await manageSavedFilter(currentOrganization.id, user.id, 'delete', { filterId });
     if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Filter verwijderd.' });
      await refreshUser();
    }
  }

  const handleApply = (filter: SavedFilter) => {
    const emptyFilters = { assigneeId: null, labels: [], priority: null, projectId: null, teamId: null };
    setFilters({ ...emptyFilters, ...filter.filters }); // Replace current filters
    toast({ title: 'Filter toegepast', description: `'${filter.name}' is nu actief.`})
  }
  

  return (
    <div className="flex items-center gap-2">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" disabled={activeFilterCount === 0}>
                    <Save className="mr-2 h-4 w-4" />
                    Huidig filter opslaan
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Filter opslaan</h4>
                        <p className="text-sm text-muted-foreground">
                            Geef dit filter een naam om het later opnieuw te gebruiken.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="filter-name">Naam</Label>
                        <Input id="filter-name" value={filterName} onChange={(e) => setFilterName(e.target.value)} />
                    </div>
                    <Button onClick={handleSave} disabled={!filterName.trim() || isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Opslaan
                    </Button>
                </div>
            </PopoverContent>
        </Popover>

        {savedFilters.length > 0 && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Star className="mr-2 h-4 w-4" />
                        Opgeslagen filters
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Kies een filter</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {savedFilters.map((filter) => (
                        <DropdownMenuItem key={filter.id} onSelect={(e) => e.preventDefault()} className="flex justify-between items-center group/item">
                           <span onClick={() => handleApply(filter)} className="flex-1 cursor-pointer">{filter.name}</span>
                            {canDelete(filter) && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/item:opacity-100" onClick={() => handleDelete(filter.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        )}
    </div>
  )
}
