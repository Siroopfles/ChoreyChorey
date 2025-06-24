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
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Home, LogOut, PlusCircle, Settings, Moon, Sun } from 'lucide-react';
import AddTaskDialog from '@/components/chorey/add-task-dialog';
import { useTheme } from 'next-themes';

type AppHeaderProps = {
  users: User[];
};

export default function AppHeader({ users }: AppHeaderProps) {
  const { setTheme, theme } = useTheme();

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-30">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <AddTaskDialog users={users}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Taak Toevoegen
          </Button>
        </AddTaskDialog>

        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Toggle notifications</span>
        </Button>

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
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={users[0]?.avatar} alt={users[0]?.name} data-ai-hint="woman smiling" />
                <AvatarFallback>{users[0]?.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mijn Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Instellingen</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Home className="mr-2 h-4 w-4" />
              <span>Support</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Uitloggen</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
