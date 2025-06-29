

'use client';

import { useAuth } from '@/contexts/auth-context';
import { TaskProvider } from '@/contexts/task-context';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, LayoutDashboard, Users, Settings, Inbox, Home, ShieldCheck, Trophy, HeartHandshake, Store, Lightbulb, Award, SquareStack, UserCog, FilePieChart, CalendarCheck, GitGraph, Globe, Plug, Bookmark, ShieldAlert, ClipboardList, BrainCircuit, Zap, MessageSquare, Pin, Briefcase, Trash2 } from 'lucide-react';
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
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import AppHeader from '@/components/chorey/app-header';
import CommandBar from '@/components/chorey/command-bar';
import BulkActionBar from '@/components/chorey/bulk-action-bar';
import AddTaskDialog from '@/components/chorey/add-task-dialog';
import EditTaskDialog from '@/components/chorey/edit-task-dialog';
import Link from 'next/link';
import AnnouncementBanner from '@/components/chorey/announcement-banner';
import { PERMISSIONS } from '@/lib/types';
import { TourProvider } from '@/contexts/tour-context';
import { IdeaProvider } from '@/contexts/idea-context';
import { GoalProvider } from '@/contexts/goal-context';
import { ShortcutHelpDialog } from '@/components/chorey/shortcut-help-dialog';
import { OrganizationProvider, useOrganization } from '@/contexts/organization-context';
import { NotificationsProvider } from '@/contexts/notification-context';
import { FilterProvider, useFilters } from '@/contexts/filter-context';
import { useTasks } from '@/contexts/task-context';

const BrandingStyle = () => {
  const { currentOrganization } = useOrganization();
  const primaryColor = currentOrganization?.settings?.branding?.primaryColor;

  if (!primaryColor) {
    return null;
  }

  const css = `:root { --primary: ${primaryColor}; }`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

const UserCosmeticStyle = () => {
  const { user } = useAuth();
  const cosmetic = user?.cosmetic;

  const fontMap = {
    'inter': 'var(--font-inter)',
    'source-sans': 'var(--font-source-sans)',
    'roboto-mono': 'var(--font-roboto-mono)',
  }

  if (!cosmetic) {
    return null;
  }
  
  const styles = [];
  if (cosmetic.primaryColor) styles.push(`--primary: ${cosmetic.primaryColor};`);
  if (cosmetic.accent) styles.push(`--accent: ${cosmetic.accent};`);
  if (cosmetic.radius) styles.push(`--radius: ${cosmetic.radius}rem;`);
  if (cosmetic.font && fontMap[cosmetic.font as keyof typeof fontMap]) {
    const fontValue = fontMap[cosmetic.font as keyof typeof fontMap];
    styles.push(`--font-sans: ${fontValue};`);
    styles.push(`--font-body: ${fontValue};`);
    styles.push(`--font-headline: ${fontValue};`);
  }

  if (styles.length === 0) {
    return null;
  }

  const css = `:root { ${styles.join(' ')} }`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};


// The main app shell with sidebar and header
function AppShell({ children }: { children: React.ReactNode }) {
    const { isAddTaskDialogOpen, setIsAddTaskDialogOpen, viewedTask, setViewedTask, tasks } = useTasks();
    const { setFilters } = useFilters();
    const { currentOrganization } = useAuth();
    const { users, projects, currentUserRole, currentUserPermissions } = useOrganization();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const announcement = currentOrganization?.settings?.announcement;
    const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
    
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
        { href: '/dashboard/organization', icon: Users, label: 'Teams & Leden', 'data-tour-id': 'organization-link' },
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
        { href: '/dashboard/settings', icon: Settings, label: 'Instellingen', 'data-tour-id': 'settings-link' },
        ...(currentUserPermissions.includes(PERMISSIONS.MANAGE_INTEGRATIONS) ? [{ href: '/dashboard/settings/integrations', icon: Plug, label: 'Integraties' }] : []),
        ...(currentUserPermissions.includes(PERMISSIONS.VIEW_AUDIT_LOG) ? [{ href: '/dashboard/audit-log', icon: ShieldCheck, label: 'Audit Log' }] : []),
        { href: '/dashboard/trash', icon: Trash2, label: 'Prullenbak' },
    ];

    const pinnedProjects = useMemo(() => projects.filter(p => p.pinned), [projects]);
    const pinnedTasks = useMemo(() => tasks.filter(t => t.pinned), [tasks]);
    
    const handleProjectClick = (projectId: string) => {
      setFilters({ projectId });
      router.push('/dashboard');
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsAddTaskDialogOpen(true);
            }
            if (e.key === '?') {
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                    return;
                }
                e.preventDefault();
                setIsShortcutHelpOpen(true);
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

                        {(pinnedProjects.length > 0 || pinnedTasks.length > 0) && (
                            <>
                                <SidebarSeparator className="my-2" />
                                <SidebarGroupLabel className="flex items-center gap-2"><Pin className="h-4 w-4"/>Vastgezet</SidebarGroupLabel>
                                {pinnedProjects.map((project) => (
                                     <SidebarMenuItem key={`pin-proj-${project.id}`}>
                                        <SidebarMenuButton tooltip={project.name} onClick={() => handleProjectClick(project.id)}>
                                            <Briefcase />
                                            <span>{project.name}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                                {pinnedTasks.map((task) => (
                                     <SidebarMenuItem key={`pin-task-${task.id}`}>
                                        <SidebarMenuButton tooltip={task.title} onClick={() => setViewedTask(task)}>
                                            <ClipboardList />
                                            <span>{task.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </>
                        )}

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
                                    <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href} data-tour-id={item['data-tour-id'] as string}>
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
                                            <SidebarMenuButton tooltip={item.label} isActive={pathname.startsWith(item.href)} data-tour-id={item['data-tour-id'] as string}>
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
            <ShortcutHelpDialog open={isShortcutHelpOpen} onOpenChange={setIsShortcutHelpOpen} />
        </SidebarProvider>
    );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, currentOrganization, mfaRequired } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; 

    if (mfaRequired) {
        if (pathname !== '/login/verify') {
            router.push('/login/verify');
        }
        return; 
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
    return pathname === '/login/verify' ? <>{children}</> : (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (pathname.startsWith('/invite/')) {
      return <>{children}</>;
  }
  
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
    <OrganizationProvider>
      <FilterProvider>
        <NotificationsProvider>
          <TaskProvider>
            <IdeaProvider>
              <GoalProvider>
                <AuthGuard>
                  <TourProvider>
                    {children}
                  </TourProvider>
                </AuthGuard>
              </GoalProvider>
            </IdeaProvider>
          </TaskProvider>
        </NotificationsProvider>
      </FilterProvider>
    </OrganizationProvider>
  );
}
