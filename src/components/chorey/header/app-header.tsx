
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/user/auth-context';
import { useView } from '@/contexts/system/view-context';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Building, ChevronsUpDown, Flame, PlusCircle, Mic, Check } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { CreateOrganizationDialog } from '../organization/create-organization-dialog';
import { MobileCommandDialog } from '../dialogs/mobile-command-dialog';
import { NotificationDropdown } from '../header/NotificationDropdown';
import { UserDropdown } from '../header/UserDropdown';

export default function AppHeader() {
  const { setIsAddTaskDialogOpen } = useView();
  const { user, organizations, currentOrganization, switchOrganization } = useAuth();
  const router = useRouter();
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isMobileCommandOpen, setIsMobileCommandOpen] = useState(false);
  
  const handleSwitch = async (orgId: string) => {
    await switchOrganization(orgId);
    router.refresh();
  }
  
  const showGamification = currentOrganization?.settings?.features?.gamification !== false;
  const currentStreak = user?.streakData?.currentStreak;

  return (
    <>
      <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-1">
          <SidebarTrigger className="md:hidden" />
          {currentOrganization && (
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-[180px] sm:w-[220px] justify-between" aria-label={`Geselecteerde organisatie: ${currentOrganization.name}. Klik om te wisselen.`}>
                          <Building className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate font-medium">{currentOrganization.name}</span>
                          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[220px]">
                      <DropdownMenuLabel>Kies Organisatie</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {organizations.map(org => (
                          <DropdownMenuItem key={org.id} onSelect={() => handleSwitch(org.id)}>
                              <div className={cn("mr-2 h-4 w-4", currentOrganization.id === org.id ? "opacity-100" : "opacity-0")}>
                                <Check />
                              </div>
                              {org.name}
                          </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                       <DropdownMenuItem onSelect={() => setIsCreateOrgOpen(true)}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Nieuwe Organisatie
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                          <Link href="/dashboard/organization">
                              <Building className="mr-2 h-4 w-4" />
                              <span>Beheer Organisaties</span>
                          </Link>
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {showGamification && currentStreak && currentStreak > 1 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="flex items-center gap-1.5 border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Flame className="h-4 w-4" />
                    <span className="font-bold">{currentStreak}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Je hebt een streak van {currentStreak} dagen!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Button onClick={() => setIsAddTaskDialogOpen(true)} data-tour-id="add-task-button" className="hidden md:flex">
            <PlusCircle className="mr-2 h-4 w-4" /> Taak Toevoegen
          </Button>

           <Button variant="ghost" size="icon" className="rounded-full md:hidden" onClick={() => setIsMobileCommandOpen(true)}>
              <Mic className="h-5 w-5" />
              <span className="sr-only">Spraakcommando</span>
            </Button>
            
            <NotificationDropdown />
            <UserDropdown />
        </div>
      </header>
      <CreateOrganizationDialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen} />
      <MobileCommandDialog open={isMobileCommandOpen} onOpenChange={setIsMobileCommandOpen} />
    </>
  );
}
