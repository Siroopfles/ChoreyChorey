
'use client';

import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/user/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, Moon, Sun, BarChart } from 'lucide-react';
import type { UserStatus } from '@/lib/types';
import { updateUserStatus as updateUserStatusAction } from '@/app/actions/user/member.actions';
import { statusStyles } from '@/lib/types/ui';
import { cn } from '@/lib/utils/utils';
import { isAfter, format } from 'date-fns';

export function UserDropdown() {
    const { setTheme, theme } = useTheme();
    const { user, logout } = useAuth();

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

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="rounded-full"
                aria-label="Toggle theme"
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
                                <AvatarImage src={user.avatar} alt={user.name} />
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
                <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Uitloggen</span>
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
