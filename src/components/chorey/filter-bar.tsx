
'use client';
import { useTasks } from "@/contexts/task-context";
import type { User, Label, Priority } from "@/lib/types";
import { ALL_LABELS, ALL_PRIORITIES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, Filter, Users, Tags, ArrowUpNarrowWide, X } from "lucide-react";
import { cn } from "@/lib/utils";


export default function FilterBar() {
  const { users, filters, setFilters, clearFilters } = useTasks();
  
  const handleLabelToggle = (label: Label) => {
    const newLabels = filters.labels.includes(label)
      ? filters.labels.filter(l => l !== label)
      : [...filters.labels, label];
    setFilters({ labels: newLabels as Label[] });
  };
  
  const activeFilterCount = (filters.assigneeId ? 1 : 0) + filters.labels.length + (filters.priority ? 1 : 0);
  const assigneeName = filters.assigneeId ? users.find(u => u.id === filters.assigneeId)?.name : null;


  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Users className="mr-2 h-4 w-4" />
            Toegewezen
            {assigneeName && <Badge variant="secondary" className="ml-2">{assigneeName}</Badge>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setFilters({ assigneeId: null })}>
            Alle Gebruikers
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {users.map(user => (
            <DropdownMenuItem key={user.id} onSelect={() => setFilters({ assigneeId: user.id })}>
              {user.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Tags className="mr-2 h-4 w-4" />
            Labels
            {filters.labels.length > 0 && <Badge variant="secondary" className="ml-2">{filters.labels.length}</Badge>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-0" align="start">
          <Command>
            <CommandInput placeholder="Zoek label..." />
            <CommandList>
              <CommandEmpty>Geen label gevonden.</CommandEmpty>
              <CommandGroup>
                {ALL_LABELS.map((label) => (
                  <CommandItem
                    key={label}
                    onSelect={() => handleLabelToggle(label)}
                  >
                    <Check className={cn("mr-2 h-4 w-4", filters.labels.includes(label) ? "opacity-100" : "opacity-0")} />
                    {label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <ArrowUpNarrowWide className="mr-2 h-4 w-4" />
            Prioriteit
            {filters.priority && <Badge variant="secondary" className="ml-2">{filters.priority}</Badge>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setFilters({ priority: null })}>
              Alle Prioriteiten
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {ALL_PRIORITIES.map(priority => (
                <DropdownMenuItem key={priority} onSelect={() => setFilters({ priority: priority as Priority })}>
                    {priority}
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={() => clearFilters()}>
          <X className="mr-2 h-4 w-4" />
          Wissen
        </Button>
      )}
    </div>
  );
}
