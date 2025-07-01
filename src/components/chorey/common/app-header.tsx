
'use client';

import type { User, UserStatus } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, LogOut, Moon, Sun, User as UserIcon, ChevronsUpDown, Building, Check, PlusCircle, Timer, Flame, Mic, BarChart } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNotifications } from '@/contexts/communication/notification-context';
import { useTasks } from '@/contexts/feature/task-context';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils/utils';
import { useAuth } from '@/contexts/user/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { isAfter } from 'date-fns';
import { statusStyles } from '@/lib/types';
import { CreateOrganizationDialog } from '../organization/create-organization-dialog';
import { updateUserStatus as updateUserStatusAction } from '@/app/actions/user/member.actions';
import { MobileCommandDialog } from '../dialogs/mobile-command-dialog';

export default function AppHeader() {
  const { setTheme, theme } = useTheme();
  const { notifications, markAllNotificationsAsRead, snoozeNotification } = useNotifications();
  const { setIsAddTaskDialogOpen } = useTasks();
  const { user, logout, organizations, currentOrganization, switchOrganization, refreshUser } = useAuth();
  const router = useRouter();
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isMobileCommandOpen, setIsMobileCommandOpen] = useState(false);

  const displayedNotifications = useMemo(() => {
    return notifications.filter(n => !n.snoozedUntil || isAfter(new Date(), n.snoozedUntil));
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return displayedNotifications.filter(n => !n.read).length;
  }, [displayedNotifications]);
  
  const handleSwitch = async (orgId: string) => {
    await switchOrganization(orgId);
    router.refresh();
  }

  const handleUpdateUserStatus = async (status: UserStatus) => {
    if (!user) return;
    await updateUserStatusAction(user.id, status);
    // The change will be picked up by the onSnapshot listener in AuthContext
  };

  const currentStatus = user?.status?.type || 'Offline';
  const dndUntil = user?.status?.until;
  const currentStatusStyle = statusStyles[currentStatus] || statusStyles.Offline;
  let statusLabel = currentStatusStyle.label;
  if (currentStatus === 'Niet storen' && dndUntil && isAfter(dndUntil, new Date())) {
    statusLabel = `Niet storen (tot ${format(dndUntil, 'HH:mm')})`;
  } else if (currentStatus === 'Niet storen' && !dndUntil) {
    statusLabel = 'Niet storen';
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
                              <Check className={cn("mr-2 h-4 w-4", currentOrganization.id === org.id ? "opacity-100" : "opacity-0")} />
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

          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                          <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 shrink-0 rounded-full p-0 flex items-center justify-center text-[10px]">{unreadCount}</Badge>
                      )}
                      <span className="sr-only">Toggle notifications</span>
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 sm:w-96">
                  <DropdownMenuLabel className="flex justify-between items-center">
                      <span className="font-bold">Notificaties</span>
                      {unreadCount > 0 && (
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={markAllNotificationsAsRead}>
                              Markeer als gelezen
                          </Button>
                      )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto">
                      {displayedNotifications.length > 0 ? (
                          displayedNotifications.map(n => (
                              <DropdownMenuItem key={n.id} className="group flex flex-col items-start gap-1 whitespace-normal" onSelect={(e) => e.preventDefault()}>
                                  <p className={cn("text-sm", !n.read ? 'font-semibold' : 'text-muted-foreground')}>{n.message}</p>
                                  <div className="w-full flex justify-between items-center">
                                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(n.createdAt, { addSuffix: true, locale: nl })}</p>
                                      <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-auto p-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                          onClick={() => snoozeNotification(n.id)}
                                      >
                                          <Timer className="mr-1 h-3 w-3" />
                                          Snooze
                                      </Button>
                                  </div>
                              </DropdownMenuItem>
                          ))
                      ) : (
                          <p className="text-sm text-muted-foreground text-center p-4">Geen notificaties</p>
                      )}
                  </div>
              </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="rounded-full"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Gebruikersmenu en status">
                      <Avatar className="h-8 w-8">
                        {user ? (
                          <>
                            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="woman smiling" />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </>
                        ) : (
                          <AvatarFallback>
                            <UserIcon className="h-5 w-5" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className={cn("absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background", currentStatusStyle.dot)} />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Status: {statusLabel}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mijn Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <div className={cn("w-2 h-2 rounded-full mr-2", currentStatusStyle.dot)} />
                  <span>Status: {statusLabel}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => handleUpdateUserStatus({ type: 'Online', until: null })}>
                      <div className={cn("w-2 h-2 rounded-full mr-2", statusStyles.Online.dot)} />
                      <span>Online</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateUserStatus({ type: 'Afwezig', until: null })}>
                      <div className={cn("w-2 h-2 rounded-full mr-2", statusStyles.Afwezig.dot)} />
                      <span>Afwezig</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateUserStatus({ type: 'In vergadering', until: null })}>
                      <div className={cn("w-2 h-2 rounded-full mr-2", statusStyles['In vergadering'].dot)} />
                      <span>In vergadering</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <div className={cn("w-2 h-2 rounded-full mr-2", statusStyles['Niet storen'].dot)} />
                        <span>Niet storen</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => { const u = new Date(); u.setMinutes(u.getMinutes() + 30); handleUpdateUserStatus({ type: 'Niet storen', until: u }); }}>Voor 30 minuten</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { const u = new Date(); u.setHours(u.getHours() + 2); handleUpdateUserStatus({ type: 'Niet storen', until: u }); }}>Voor 2 uur</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { const u = new Date(); u.setHours(22, 0, 0, 0); handleUpdateUserStatus({ type: 'Niet storen', until: u }); }}>Tot vanavond</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { const u = new Date(); u.setDate(u.getDate() + 1); u.setHours(8, 0, 0, 0); handleUpdateUserStatus({ type: 'Niet storen', until: u }); }}>Tot morgenochtend</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateUserStatus({ type: 'Niet storen', until: null })}>Tot ik het uitzet</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleUpdateUserStatus({ type: 'Offline', until: null })}>
                      <div className={cn("w-2 h-2 rounded-full mr-2", statusStyles.Offline.dot)} />
                      <span>Offline</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/profile">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profiel</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/my-stats">
                  <BarChart className="mr-2 h-4 w-4" />
                  <span>Mijn Statistieken</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Uitloggen</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <CreateOrganizationDialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen} />
      <MobileCommandDialog open={isMobileCommandOpen} onOpenChange={setIsMobileCommandOpen} />
    </>
  );
}
