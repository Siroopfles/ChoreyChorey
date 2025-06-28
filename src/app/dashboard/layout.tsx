

'use client';

import { useAuth } from '@/contexts/auth-context';
import { TaskProvider, useTasks } from '@/contexts/task-context';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, LayoutDashboard, Users, Settings, Inbox, Home, ShieldCheck, Trophy, HeartHandshake, Store, Lightbulb, Award, SquareStack, UserCog, FilePieChart, CalendarCheck, GitGraph, Globe, Plug, Bookmark, ShieldAlert, ClipboardList, BrainCircuit, Zap, MessageSquare } from 'lucide-react';
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
import EditTaskDialog from '@/components/chorey/edit-task-dialog';
import Link from 'next/link';
import AnnouncementBanner from '@/components/chorey/announcement-banner';
import { PERMISSIONS } from '@/lib/types';

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
    const { isAddTaskDialogOpen, setIsAddTaskDialogOpen, viewedTask, setViewedTask } = useTasks();
    const { currentUserRole, currentOrganization, users, currentUserPermissions } = useAuth();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const announcement = currentOrganization?.settings?.announcement;
    
    const isGuest = currentUserRole === 'Guest';
    const features = currentOrganization?.settings?.features;
    const showGamification = features?.gamification !== false;
    const showGoals = features?.goals !== false;
    const showIdeas = features?.ideas !== false;
    const showMentorship = features?.mentorship !== false;

    const mainNavItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        ...(!isGuest ? [{ href: '/dashboard/chat', icon: MessageSquare, label: 'Chat' }] : []),
        ...(!isGuest ? [{ href: '/dashboard/my-week', icon: CalendarCheck, label: 'Mijn Week' }] : []),
        ...(!isGuest ? [{ href: '/dashboard/inbox', icon: Inbox, label: 'Inbox' }] : []),
    ];
    
    const planningNavItems = isGuest ? [] : [
        ...(showGoals ? [{ href: '/dashboard/goals', icon: Trophy, label: 'Doelen' }] : []),
        ...(showIdeas ? [{ href: '/dashboard/ideas', icon: Lightbulb, label: 'Ideeënbus' }] : []),
        { href: '/dashboard/workload', icon: GitGraph, label: 'Workload' },
        { href: '/dashboard/reports', icon: FilePieChart, label: 'Rapporten' },
        { href: '/dashboard/automations', icon: Zap, label: 'Automatiseringen' },
        { href: '/dashboard/templates', icon: SquareStack, label: 'Templates' },
    ];
    
    const communityNavItems = isGuest ? [] : [
        { href: '/dashboard/organization', icon: Users, label: 'Teams & Leden' },
        { href: '/dashboard/team-room', icon: Home, label: 'Team Room' },
        { href: '/dashboard/team-health', icon: ShieldAlert, label: 'Team Welzijn'},
        ...(showGamification ? [
            { href: '/dashboard/leaderboard', icon: Award, label: 'Prestaties' },
            ...(showMentorship ? [{ href: '/dashboard/mentorship', icon: HeartHandshake, label: 'Mentorschap' }] : []),
            { href: '/dashboard/shop', icon: Store, label: 'Winkel' },
        ] : []),
    ];

    const aiToolsNavItems = isGuest ? [] : [
        { href: '/dashboard/digest', icon: UserCog, label: 'AI Digest' },
        { href: '/dashboard/headcount', icon: UserCog, label: 'AI Headcount' },
        { href: '/dashboard/project-report', icon: ClipboardList, label: 'AI Project Rapport' },
        { href: '/dashboard/predictive-analysis', icon: BrainCircuit, label: 'AI Voorspellende Analyse' },
    ];
    
    const adminNavItems = isGuest ? [] : [
        { href: '/dashboard/settings', icon: Settings, label: 'Instellingen' },
        ...(currentUserPermissions.includes(PERMISSIONS.MANAGE_INTEGRATIONS) ? [{ href: '/dashboard/settings/integrations', icon: Plug, label: 'Integraties' }] : []),
        ...(currentUserPermissions.includes(PERMISSIONS.VIEW_AUDIT_LOG) ? [{ href: '/dashboard/audit-log', icon: ShieldCheck, label: 'Audit Log' }] : []),
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
    
    useEffect(() => {
        const shouldAddTask = searchParams.get('addTask') === 'true';
        if (shouldAddTask) {
            setIsAddTaskDialogOpen(true);
        }
    }, [searchParams, setIsAddTaskDialogOpen]);


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

                        {planningNavItems.length > 0 && <SidebarSeparator className="my-2" />}
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
                        
                        {communityNavItems.length > 0 && <SidebarSeparator className="my-2" />}
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

                        {aiToolsNavItems.length > 0 && <SidebarSeparator className="my-2" />}
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

                         {adminNavItems.length > 0 && (
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
            {viewedTask && (
                <EditTaskDialog
                  isOpen={!!viewedTask}
                  setIsOpen={(isOpen) => { if (!isOpen) setViewedTask(null); }}
                  task={viewedTask}
                  users={users}
                />
            )}
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
