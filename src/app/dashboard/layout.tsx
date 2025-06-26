
'use client';

import { useAuth } from '@/contexts/auth-context';
import { TaskProvider, useTasks } from '@/contexts/task-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, LayoutDashboard, Users, LayoutTemplate, Settings, CalendarDays, Inbox, Home } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import AppHeader from '@/components/chorey/app-header';
import CommandBar from '@/components/chorey/command-bar';
import Leaderboard from '@/components/chorey/leaderboard';
import BulkActionBar from '@/components/chorey/bulk-action-bar';
import UserProfileSheet from '@/components/chorey/user-profile-sheet';
import AddTaskDialog from '@/components/chorey/add-task-dialog';
import Link from 'next/link';

// The main app shell with sidebar and header
function AppShell({ children }: { children: React.ReactNode }) {
    const { users, viewedUser, setViewedUser, isAddTaskDialogOpen, setIsAddTaskDialogOpen } = useTasks();
    const pathname = usePathname();

    const navItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/my-week', icon: CalendarDays, label: 'Mijn Week' },
        { href: '/dashboard/inbox', icon: Inbox, label: 'Inbox' },
        { href: '/dashboard/team-room', icon: Home, label: 'Team Room' },
        { href: '/dashboard/organization', icon: Users, label: 'Teams & Leden' },
        { href: '/dashboard/templates', icon: LayoutTemplate, label: 'Templates' },
        { href: '/dashboard/settings', icon: Settings, label: 'Instellingen' },
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsAddTaskDialogOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsAddTaskDialogOpen]);


    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="p-4 border-b border-sidebar-border">
                    <Link href="/dashboard">
                        <h1 className="text-2xl font-bold text-sidebar-primary">Chorey</h1>
                    </Link>
                </SidebarHeader>
                <SidebarContent className="p-4 flex flex-col">
                    <CommandBar />
                    <SidebarMenu className="mt-4">
                        {navItems.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <Link href={item.href} passHref>
                                    <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                    <div className="flex-1 overflow-y-auto mt-4">
                        <Leaderboard users={users} />
                    </div>
                </SidebarContent>
            </Sidebar>

            <SidebarInset className="flex flex-col">
                <AppHeader />
                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 relative">
                    {children}
                </main>
                <BulkActionBar />
            </SidebarInset>

            {viewedUser && (
                <UserProfileSheet
                    user={viewedUser}
                    isOpen={!!viewedUser}
                    onOpenChange={(isOpen) => !isOpen && setViewedUser(null)}
                />
            )}
            <AddTaskDialog users={users} open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen} />
        </SidebarProvider>
    );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, currentOrganization } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; 

    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user && !currentOrganization && !pathname.startsWith('/dashboard/organization') && !pathname.startsWith('/invite/')) {
      router.push('/dashboard/organization');
    }

  }, [user, loading, currentOrganization, router, pathname]);

  if (loading || (!user && !pathname.startsWith('/invite/'))) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Allow access to invite page without an organization
  if (pathname.startsWith('/invite/')) {
      return <>{children}</>;
  }


  if (!currentOrganization && pathname !== '/dashboard/organization') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Organisatie laden...</p>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TaskProvider>
      <AuthGuard>
        {children}
      </AuthGuard>
    </TaskProvider>
  );
}
