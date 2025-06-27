
'use client';

import { useAuth } from '@/contexts/auth-context';
import { TaskProvider, useTasks } from '@/contexts/task-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, LayoutDashboard, Users, Settings, CalendarDays, Inbox, Home, ShieldCheck, Trophy, HeartHandshake, Store, Target, GitGraph, MailCheck, BarChart3, Lightbulb, Award, SquareStack, UserCog, FilePieChart, CalendarCheck } from 'lucide-react';
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
    const { isAddTaskDialogOpen, setIsAddTaskDialogOpen } = useTasks();
    const { currentUserRole, currentOrganization, users } = useAuth();
    const pathname = usePathname();
    const announcement = currentOrganization?.settings?.announcement;

    const showGamification = currentOrganization?.settings?.features?.gamification !== false;

    const mainNavItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/my-week', icon: CalendarCheck, label: 'Mijn Week' },
        { href: '/dashboard/inbox', icon: Inbox, label: 'Inbox' },
    ];
    
    const planningNavItems = [
        { href: '/dashboard/goals', icon: Trophy, label: 'Doelen' },
        { href: '/dashboard/ideas', icon: Lightbulb, label: 'Ideeënbus' },
        { href: '/dashboard/workload', icon: BarChart3, label: 'Workload' },
        { href: '/dashboard/reports', icon: FilePieChart, label: 'Rapporten' },
        { href: '/dashboard/templates', icon: SquareStack, label: 'Templates' },
    ];
    
    const communityNavItems = [
        { href: '/dashboard/organization', icon: Users, label: 'Teams & Leden' },
        { href: '/dashboard/team-room', icon: Home, label: 'Team Room' },
        ...(showGamification ? [
            { href: '/dashboard/leaderboard', icon: Award, label: 'Prestaties' },
            { href: '/dashboard/mentorship', icon: HeartHandshake, label: 'Mentorschap' },
            { href: '/dashboard/shop', icon: Store, label: 'Winkel' },
        ] : []),
    ];

    const aiToolsNavItems = [
        { href: '/dashboard/digest', icon: MailCheck, label: 'AI Digest' },
        { href: '/dashboard/headcount', icon: UserCog, label: 'AI Headcount' },
    ];

    const adminNavItems = [
        { href: '/dashboard/settings/organization', icon: Settings, label: 'Instellingen' },
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
                        {mainNavItems.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <Link href={item.href} passHref>
                                    <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}

                        <SidebarSeparator className="my-2" />
                        {planningNavItems.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <Link href={item.href} passHref>
                                    <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                        
                        <SidebarSeparator className="my-2" />
                        {communityNavItems.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <Link href={item.href} passHref>
                                    <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}

                        <SidebarSeparator className="my-2" />
                        {aiToolsNavItems.map((item) => (
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
                                            <SidebarMenuButton tooltip={item.label} isActive={pathname.startsWith(item.href)}>
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
