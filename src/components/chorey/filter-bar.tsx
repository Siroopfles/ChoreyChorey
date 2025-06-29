

'use client';
import { useTasks } from "@/contexts/task-context";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, Users, Tags, ArrowUpNarrowWide, X, User as UserIcon, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { SavedFiltersManager } from "./saved-filters-manager";


export default function FilterBar() {
  const { filters, setFilters, clearFilters, activeFilterCount } = useTasks();
  const { user: currentUser } = useAuth();
  const { projects, users, currentOrganization } = useOrganization();
  
  const allLabels = currentOrganization?.settings?.customization?.labels || [];
  const allPriorities = currentOrganization?.settings?.customization?.priorities || [];


  const handleLabelToggle = (label: string) => {
    const newLabels = filters.labels.includes(label)
      ? filters.labels.filter(l => l !== label)
      : [...filters.labels, label];
    setFilters({ labels: newLabels });
  };
  
  const assigneeName = filters.assigneeId ? users.find(u => u.id === filters.assigneeId)?.name : null;
  const projectName = filters.projectId ? projects.find(p => p.id === filters.projectId)?.name : null;


  const handleSetMyTasks = () => {
    if (currentUser) {
        setFilters({ assigneeId: currentUser.id });
    }
  }


  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={handleSetMyTasks} data-tour-id="my-tasks-filter">
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
            <Briefcase className="mr-2 h-4 w-4" />
            Project
            {projectName && <Badge variant="secondary" className="ml-2">{projectName}</Badge>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setFilters({ projectId: null })}>
            Alle Projecten
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {projects.map(project => (
            <DropdownMenuItem key={project.id} onSelect={() => setFilters({ projectId: project.id })}>
              {project.name}
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
                {allLabels.map((label) => (
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
            {allPriorities.map(priority => (
                <DropdownMenuItem key={priority} onSelect={() => setFilters({ priority: priority })}>
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

      <SavedFiltersManager />
    </div>
  );
}
