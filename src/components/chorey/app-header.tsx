
'use client';

import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, LogOut, Moon, Sun, User as UserIcon, ChevronsUpDown, Building, Check, PlusCircle, Timer } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTasks } from '@/contexts/task-context';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { isAfter } from 'date-fns';
import { USER_STATUSES } from '@/lib/types';

const statusStyles: Record<string, { dot: string, label: string }> = {
  Online: { dot: 'bg-green-500', label: 'Online' },
  Afwezig: { dot: 'bg-yellow-500', label: 'Afwezig' },
  'In vergadering': { dot: 'bg-red-500', label: 'In vergadering' },
  Offline: { dot: 'bg-gray-400', label: 'Offline' },
};

export default function AppHeader() {
  const { setTheme, theme } = useTheme();
  const { notifications, markAllNotificationsAsRead, snoozeNotification, setIsAddTaskDialogOpen } = useTasks();
  const { user, logout, organizations, currentOrganization, switchOrganization, updateUserStatus } = useAuth();
  const router = useRouter();

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

  const currentStatus = user?.status?.type || 'Offline';
  const currentStatusStyle = statusStyles[currentStatus] || statusStyles.Offline;

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-30">
      <SidebarTrigger className="md:hidden" />
      
      <div>
        {currentOrganization && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[180px] sm:w-[220px] justify-between">
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
        <Button onClick={() => setIsAddTaskDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Taak Toevoegen
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
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative">
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
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mijn Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <div className={cn("w-2 h-2 rounded-full mr-2", currentStatusStyle.dot)} />
                <span>Status: {currentStatusStyle.label}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {USER_STATUSES.map(status => (
                    <DropdownMenuItem key={status.value} onClick={() => updateUserStatus({ type: status.value })}>
                       <div className={cn("w-2 h-2 rounded-full mr-2", (statusStyles[status.value] || statusStyles.Offline).dot)} />
                       <span>{status.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem asChild>
               <Link href="/dashboard/settings">
                 <UserIcon className="mr-2 h-4 w-4" />
                 <span>Profiel</span>
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
  );
}
