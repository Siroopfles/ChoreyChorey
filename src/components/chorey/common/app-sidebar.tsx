
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useOrganization } from '@/contexts/system/organization-context';
import { useTasks } from '@/contexts/feature/task-context';
import { useFilters } from '@/contexts/system/filter-context';
import { useAuth } from '@/contexts/user/auth-context';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroupLabel,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import CommandBar from '@/components/chorey/common/command-bar';
import { ChevronsLeft, LayoutDashboard, MessageSquare, CalendarCheck, Inbox, Pin, Briefcase, ClipboardList, Trophy, Lightbulb, GitGraph, FilePieChart, Zap, SquareStack, Users, Home, ShieldAlert, Award, HeartHandshake, Store, UserCog, Settings, Plug, ShieldCheck, Trash2, Camera, AreaChart, BrainCircuit, BarChartHorizontal, CircleDollarSign, HeartPulse } from 'lucide-react';
import { ROLE_GUEST, PERMISSIONS } from '@/lib/types';


function SidebarToggle() {
  const { toggleSidebar, state } = useSidebar();

  return (
    <SidebarMenuButton
      onClick={toggleSidebar}
      tooltip={state === "expanded" ? "Inklappen" : "Uitklappen"}
      className="h-9 justify-start"
      aria-label={state === "expanded" ? "Zijbalk inklappen" : "Zijbalk uitklappen"}
    >
      <ChevronsLeft className="size-4 shrink-0 duration-200 group-data-[state=collapsed]:rotate-180" />
      <span className="group-data-[state=collapsed]:hidden">
        Inklappen
      </span>
    </SidebarMenuButton>
  );
}

export default function AppSidebar() {
    const { tasks, setViewedTask } = useTasks();
    const { setFilters } = useFilters();
    const { currentUserRole, currentUserPermissions, currentOrganization, projects } = useOrganization();
    const pathname = usePathname();
    const router = useRouter();

    const isGuest = currentUserRole === ROLE_GUEST;
    const features = currentOrganization?.settings?.features;
    const showGamification = features?.gamification !== false;
    const showGoals = features?.goals !== false;
    const showIdeas = features?.ideas !== false;
    const showMentorship = features?.mentorship !== false;

    const mainNavItems = [
        { href: '/dashboard/general/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        ...(!isGuest ? [{ href: '/dashboard/productivity-workflow/chat', icon: MessageSquare, label: 'Chat' }] : []),
        { href: '/dashboard/ai-predictive/scan', icon: Camera, label: 'Scan' },
        ...(!isGuest ? [{ href: '/dashboard/productivity-workflow/my-week', icon: CalendarCheck, label: 'Mijn Week' }] : []),
        ...(!isGuest ? [{ href: '/dashboard/productivity-workflow/inbox', icon: Inbox, label: 'Inbox' }] : []),
    ];
    
    const planningNavItems = isGuest ? [] : [
        ...(showGoals ? [{ href: '/dashboard/general/goals', icon: Trophy, label: 'Doelen' }] : []),
        ...(showIdeas ? [{ href: '/dashboard/general/ideas', icon: Lightbulb, label: 'Ideeënbus' }] : []),
        { href: '/dashboard/productivity-workflow/workload', icon: GitGraph, label: 'Workload' },
        { href: '/dashboard/analytics-reporting/reports', icon: FilePieChart, label: 'Rapporten' },
        { href: '/dashboard/analytics-reporting/cost-analysis', icon: CircleDollarSign, label: 'Kostenanalyse' },
        { href: '/dashboard/analytics-reporting/analytics', icon: AreaChart, label: 'Analyse' },
        { href: '/dashboard/team-organization/team-velocity', icon: BarChartHorizontal, label: 'Team Velocity' },
        ...(currentUserPermissions.includes(PERMISSIONS.MANAGE_AUTOMATIONS) ? [{ href: '/dashboard/productivity-workflow/automations', icon: Zap, label: 'Automatiseringen' }] : []),
        ...(currentUserPermissions.includes(PERMISSIONS.MANAGE_TEMPLATES) ? [{ href: '/dashboard/general/templates', icon: SquareStack, label: 'Templates' }] : []),
        ...(currentUserPermissions.includes(PERMISSIONS.MANAGE_CHECKLISTS) ? [{ href: '/dashboard/productivity-workflow/checklists', icon: ClipboardList, label: 'Checklists' }] : []),
    ];
    
    const communityNavItems = isGuest ? [] : [
        { href: '/dashboard/team-organization/organization', icon: Users, label: 'Teams & Leden', 'data-tour-id': 'organization-link' },
        { href: '/dashboard/team-organization/team-room', icon: Home, label: 'Team Room' },
        { href: '/dashboard/team-organization/team-health', icon: ShieldAlert, label: 'Team Welzijn'},
        ...(showGamification ? [
            { href: '/dashboard/team-organization/leaderboard', icon: Award, label: 'Prestaties' },
            ...(showMentorship ? [{ href: '/dashboard/team-organization/mentorship', icon: HeartHandshake, label: 'Mentorschap' }] : []),
            { href: '/dashboard/general/shop', icon: Store, label: 'Winkel' },
        ] : []),
    ];

    const aiToolsNavItems = isGuest ? [] : [
        { href: '/dashboard/productivity-workflow/digest', icon: UserCog, label: 'AI Digest' },
        { href: '/dashboard/team-organization/headcount', icon: UserCog, label: 'AI Headcount' },
        { href: '/dashboard/analytics-reporting/project-report', icon: ClipboardList, label: 'AI Project Rapport' },
        { href: '/dashboard/ai-predictive/predictive-analysis', icon: HeartPulse, label: 'Projectgezondheid (AI)' },
        { href: '/dashboard/ai-predictive/scenario-planner', icon: BrainCircuit, label: 'AI Scenario Planner' },
        { href: '/dashboard/general/dashboard/ai-insights', icon: BrainCircuit, label: 'AI Inzichten' },
    ];
    
    const adminNavItems = isGuest ? [] : [
        ...(currentUserPermissions.includes(PERMISSIONS.VIEW_ORGANIZATION_SETTINGS) ? [{ href: '/dashboard/user-settings/settings/general', icon: Settings, label: 'Instellingen', 'data-tour-id': 'settings-link' }] : []),
        ...(currentUserPermissions.includes(PERMISSIONS.MANAGE_INTEGRATIONS) ? [{ href: '/dashboard/user-settings/settings/integrations', icon: Plug, label: 'Integraties' }] : []),
        ...(currentUserPermissions.includes(PERMISSIONS.VIEW_AUDIT_LOG) ? [{ href: '/dashboard/general/audit-log', icon: ShieldCheck, label: 'Audit Log' }] : []),
        { href: '/dashboard/general/trash', icon: Trash2, label: 'Prullenbak' },
    ];

    const pinnedProjects = useMemo(() => projects.filter(p => p.pinned), [projects]);
    const pinnedTasks = useMemo(() => tasks.filter(t => t.pinned), [tasks]);
    
    const handleProjectClick = (projectId: string) => {
      setFilters({ projectId });
      router.push('/dashboard/general');
    };


    return (
        <Sidebar collapsible="icon" className="hidden md:flex">
            <SidebarHeader className="p-4 border-b border-sidebar-border">
                <Link href="/dashboard/general">
                    <h1 className="text-2xl font-bold text-sidebar-primary group-data-[state=collapsed]:hidden">{currentOrganization?.name || 'Chorey'}</h1>
                </Link>
            </SidebarHeader>
            <SidebarContent className="p-4 flex flex-col">
                <CommandBar />
                <SidebarMenu className="mt-4">
                    {mainNavItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <Link href={item.href} passHref>
                                <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href} aria-label={item.label}>
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
                                    <SidebarMenuButton tooltip={project.name} onClick={() => handleProjectClick(project.id)} aria-label={`Ga naar project ${project.name}`}>
                                        <Briefcase />
                                        <span>{project.name}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                            {pinnedTasks.map((task) => (
                                 <SidebarMenuItem key={`pin-task-${task.id}`}>
                                    <SidebarMenuButton tooltip={task.title} onClick={() => setViewedTask(task)} aria-label={`Open taak ${task.title}`}>
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
                                <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href} aria-label={item.label}>
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
                                <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href} data-tour-id={item['data-tour-id'] as string} aria-label={item.label}>
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
                                <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href} aria-label={item.label}>
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
                                        <SidebarMenuButton tooltip={item.label} isActive={pathname.startsWith(item.href)} data-tour-id={item['data-tour-id'] as string} aria-label={item.label}>
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
            <SidebarFooter className="mt-auto border-t border-sidebar-border p-2">
                <SidebarToggle />
            </SidebarFooter>
        </Sidebar>
    );
}
