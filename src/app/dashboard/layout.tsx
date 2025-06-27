
'use client';

import { useAuth } from '@/contexts/auth-context';
import { TaskProvider, useTasks } from '@/contexts/task-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, LayoutDashboard, Users, LayoutTemplate, Settings, CalendarDays, Inbox, Home, ShieldCheck, Trophy, HeartHandshake, Store, MailCheck, FilePieChart, Target } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import AppHeader from '@/components/chorey/app-header';
import CommandBar from '@/components/chorey/command-bar';
import BulkActionBar from '@/components/chorey/bulk-action-bar';
import UserProfileSheet from '@/components/chorey/user-profile-sheet';
import AddTaskDialog from '@/components/chorey/add-task-dialog';
import Link from 'next/link';
import AnnouncementBanner from '@/components/chorey/announcement-banner';

const BrandingStyle = () => {
  const { currentOrganization } = useAuth();
  const primaryColor = currentOrganization?.settings?.branding?.primaryColor;

  if (!primaryColor) {
    return null;
  }

  const css = `:root { --primary: ${primaryColor}; }`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

const UserCosmeticStyle = () => {
  const { user } = useAuth();
  const primaryColor = user?.cosmetic?.primaryColor;

  if (!primaryColor) {
    return null;
  }

  const css = `:root { --primary: ${primaryColor}; }`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};


// The main app shell with sidebar and header
function AppShell({ children }: { children: React.ReactNode }) {
    const { users, tasks, viewedUser, setViewedUser, isAddTaskDialogOpen, setIsAddTaskDialogOpen } = useTasks();
    const { currentUserRole, currentOrganization } = useAuth();
    const pathname = usePathname();
    const announcement = currentOrganization?.settings?.announcement;

    const navItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/my-week', icon: CalendarDays, label: 'Mijn Week' },
        { href: '/dashboard/goals', icon: Target, label: 'Mijn Doelen' },
        { href: '/dashboard/inbox', icon: Inbox, label: 'Inbox' },
        { href: '/dashboard/digest', icon: MailCheck, label: 'Overzicht' },
        { href: '/dashboard/reports', icon: FilePieChart, label: 'Rapporten' },
        { href: '/dashboard/team-room', icon: Home, label: 'Team Room' },
        { href: '/dashboard/leaderboard', icon: Trophy, label: 'Prestaties' },
        { href: '/dashboard/mentorship', icon: HeartHandshake, label: 'Mentorschap' },
        { href: '/dashboard/shop', icon: Store, label: 'Puntenwinkel' },
        { href: '/dashboard/organization', icon: Users, label: 'Teams & Leden' },
        { href: '/dashboard/templates', icon: LayoutTemplate, label: 'Templates' },
        { href: '/dashboard/settings', icon: Settings, label: 'Instellingen' },
    ];
    
    const adminNavItems = [
        { href: '/dashboard/audit-log', icon: ShieldCheck, label: 'Audit Log' }
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
            <BrandingStyle />
            <UserCosmeticStyle />
            <Sidebar>
                <SidebarHeader className="p-4 border-b border-sidebar-border">
                    <Link href="/dashboard">
                        <h1 className="text-2xl font-bold text-sidebar-primary">{currentOrganization?.name || 'Chorey'}</h1>
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
                         {(currentUserRole === 'Owner' || currentUserRole === 'Admin') && (
                            <>
                                <SidebarSeparator className="my-2" />
                                {adminNavItems.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <Link href={item.href} passHref>
                                            <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href}>
                                                <item.icon />
                                                <span>{item.label}</span>
                                            </SidebarMenuButton>
                                        </Link>
                                    </SidebarMenuItem>
                                ))}
                            </>
                        )}
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>

            <SidebarInset className="flex flex-col">
                <AppHeader />
                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 relative">
                    {announcement && <AnnouncementBanner announcement={announcement} />}
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
  const { user, loading, currentOrganization, mfaRequired } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; 

    // Handle MFA flow first
    if (mfaRequired) {
        if (pathname !== '/login/verify') {
            router.push('/login/verify');
        }
        return; // Stop further checks if MFA is required
    }
    
    if (!user) {
      const allowedPaths = ['/login', '/signup', '/invite/[inviteId]'];
      const isAllowed = allowedPaths.some(p => pathname.startsWith(p.replace(/\[.*?\]/, '')))
      if (!isAllowed) {
        router.push('/login');
      }
      return;
    }
    
    if (user && !currentOrganization && !pathname.startsWith('/dashboard/organization') && !pathname.startsWith('/invite/') && !pathname.startsWith('/dashboard/focus')) {
      router.push('/dashboard/organization');
    }

  }, [user, loading, currentOrganization, mfaRequired, router, pathname]);

  if (loading || (!user && !pathname.startsWith('/invite/') && pathname !== '/login/verify')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (mfaRequired) {
    // Render children if on verify page, otherwise AuthGuard's effect will redirect.
    return pathname === '/login/verify' ? <>{children}</> : (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Allow access to invite page without an organization
  if (pathname.startsWith('/invite/')) {
      return <>{children}</>;
  }
  
  // Allow access to focus mode without the main AppShell
  if (pathname.startsWith('/dashboard/focus')) {
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
