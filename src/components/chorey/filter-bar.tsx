'use client';
import { useTasks } from "@/contexts/task-context";
import { useAuth } from "@/contexts/auth-context";
import type { User, Label, Priority } from "@/lib/types";
import { ALL_LABELS, ALL_PRIORITIES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, Filter, Users, Tags, ArrowUpNarrowWide, X, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";


export default function FilterBar() {
  const { users, filters, setFilters, clearFilters } = useTasks();
  const { user: currentUser, teams } = useAuth();
  
  const handleLabelToggle = (label: Label) => {
    const newLabels = filters.labels.includes(label)
      ? filters.labels.filter(l => l !== label)
      : [...filters.labels, label];
    setFilters({ labels: newLabels as Label[] });
  };
  
  const activeFilterCount = (filters.assigneeId ? 1 : 0) + filters.labels.length + (filters.priority ? 1 : 0) + (filters.teamId ? 1 : 0);
  const assigneeName = filters.assigneeId ? users.find(u => u.id === filters.assigneeId)?.name : null;
  const teamName = filters.teamId ? teams.find(t => t.id === filters.teamId)?.name : null;


  const handleSetMyTasks = () => {
    if (currentUser) {
        setFilters({ assigneeId: currentUser.id });
    }
  }


  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={handleSetMyTasks}>
          <UserIcon className="mr-2 h-4 w-4"/>
          Mijn Taken
      </Button>

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

       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Users className="mr-2 h-4 w-4" />
            Team
            {teamName && <Badge variant="secondary" className="ml-2">{teamName}</Badge>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setFilters({ teamId: null })}>
            Alle Teams
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {teams.map(team => (
            <DropdownMenuItem key={team.id} onSelect={() => setFilters({ teamId: team.id })}>
              {team.name}
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