'use client';

import { useAuth } from '@/contexts/user/auth-context';
import { TaskProvider } from '@/contexts/feature/task-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { TourProvider } from '@/contexts/feature/tour-context';
import { IdeaProvider } from '@/contexts/feature/idea-context';
import { GoalProvider } from '@/contexts/feature/goal-context';
import { ChecklistProvider } from '@/contexts/feature/checklist-context';
import { TemplateProvider } from '@/contexts/feature/template-context';
import { AutomationProvider } from '@/contexts/feature/automation-context';
import { ReportProvider } from '@/contexts/feature/report-context';
import { OrganizationProvider } from '@/contexts/system/organization-context';
import { NotificationsProvider } from '@/contexts/communication/notification-context';
import { FilterProvider } from '@/contexts/system/filter-context';
import { CallProvider } from '@/contexts/communication/call-context';
import { PresenceProvider } from '@/contexts/communication/presence-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { FCMProvider } from '@/contexts/communication/fcm-context';
import AppShell from '@/components/chorey/common/app-shell';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, mfaRequired, currentOrganizationId } = useAuth();
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
      const allowedPaths = ['/login', '/signup', '/invite/[inviteId]', '/public/project/[projectId]'];
      const isAllowed = allowedPaths.some(p => pathname.startsWith(p.replace(/\[.*?\]/, '')))
      if (!isAllowed) {
        router.push('/login');
      }
      return;
    }
    
    if (user && !currentOrganizationId && !pathname.startsWith('/dashboard/team-organization/organization') && !pathname.startsWith('/invite/') && !pathname.startsWith('/dashboard/focus')) {
      router.push('/dashboard/organization');
    }

  }, [user, loading, currentOrganizationId, mfaRequired, router, pathname]);

  if (loading || (!user && !['/login', '/signup', '/invite', '/public/project'].some(p => pathname.startsWith(p)) && pathname !== '/login/verify')) {
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
  
  if (['/login', '/signup', '/invite', '/public/project'].some(p => pathname.startsWith(p))) {
      return <>{children}</>;
  }
  
  if (pathname.startsWith('/dashboard/focus') || pathname.startsWith('/dashboard/whiteboard')) {
      return <>{children}</>;
  }

  if (!currentOrganizationId && pathname !== '/dashboard/organization') {
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
      <TaskProvider>
        <FilterProvider>
          <NotificationsProvider>
            <IdeaProvider>
              <GoalProvider>
                <TemplateProvider>
                  <AutomationProvider>
                    <ReportProvider>
                      <ChecklistProvider>
                        <FCMProvider>
                          <CallProvider>
                            <PresenceProvider>
                              <SidebarProvider>
                                <AuthGuard>
                                <TourProvider>
                                    {children}
                                </TourProvider>
                                </AuthGuard>
                              </SidebarProvider>
                            </PresenceProvider>
                          </CallProvider>
                        </FCMProvider>
                      </ChecklistProvider>
                    </ReportProvider>
                  </AutomationProvider>
                </TemplateProvider>
              </GoalProvider>
            </IdeaProvider>
          </NotificationsProvider>
        </FilterProvider>
      </TaskProvider>
    </OrganizationProvider>
  );
}
