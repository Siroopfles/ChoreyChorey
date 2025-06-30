
'use client';

import { useAuth } from '@/contexts/auth-context';
import { TaskProvider } from '@/contexts/task-context';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AppHeader from '@/components/chorey/app-header';
import AddTaskDialog from '@/components/chorey/add-task-dialog';
import EditTaskDialog from '@/components/chorey/edit-task-dialog';
import AnnouncementBanner from '@/components/chorey/announcement-banner';
import { PERMISSIONS, UserStatus } from '@/lib/types';
import { TourProvider } from '@/contexts/tour-context';
import { IdeaProvider } from '@/contexts/idea-context';
import { GoalProvider } from '@/contexts/goal-context';
import { ChecklistProvider } from '@/contexts/checklist-context';
import { ShortcutHelpDialog } from '@/components/chorey/shortcut-help-dialog';
import { OrganizationProvider, useOrganization } from '@/contexts/organization-context';
import { NotificationsProvider } from '@/contexts/notification-context';
import { FilterProvider } from '@/contexts/filter-context';
import { useTasks } from '@/contexts/task-context';
import { CallProvider } from '@/contexts/call-context';
import { AudioHuddle } from '@/components/chorey/audio-huddle/AudioHuddle';
import { PresenceProvider } from '@/contexts/presence-context';
import { LiveCursors } from '@/components/chorey/live-cursors';
import AppSidebar from '@/components/chorey/app-sidebar';
import MobileBottomNav from '@/components/chorey/mobile-bottom-nav';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { BulkActionBar } from '@/components/chorey/bulk-action-bar';
import { FCMProvider } from '@/contexts/fcm-context';


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
    const { updateUserPresence } = useAuth();
    const { currentOrganization } = useOrganization();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();
    
    const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
    const announcement = currentOrganization?.settings?.announcement;

    useEffect(() => {
        if (!updateUserPresence) return;

        let currentPage = '';
        if (viewedTask) {
            currentPage = `Bewerkt taak: "${viewedTask.title}"`;
        } else if (pathname.startsWith('/dashboard/focus/')) {
            const taskId = pathname.split('/').pop();
            const task = tasks.find(t => t.id === taskId);
            currentPage = `Focust op: "${task?.title || 'een taak'}"`;
        } else if (pathname === '/dashboard') {
            currentPage = 'Op Dashboard';
        } else {
            const pageName = pathname.replace('/dashboard/', '').split('/')[0];
            currentPage = `Op pagina: ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`;
        }
        
        const presenceUpdate: Partial<UserStatus> = { currentPage };
        updateUserPresence(presenceUpdate);

    }, [pathname, viewedTask, updateUserPresence, tasks]);


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
        <div className="flex flex-col h-screen">
          <BrandingStyle />
          <UserCosmeticStyle />
          <AppSidebar />
          <div className={cn("flex flex-col flex-1", isMobile ? "pb-16" : "")}>
            <AppHeader />
            <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 relative">
              {announcement && <AnnouncementBanner announcement={announcement} />}
              {children}
              <LiveCursors />
            </main>
            <BulkActionBar />
          </div>
          <MobileBottomNav />

          <AddTaskDialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen} />
          {viewedTask && (
            <EditTaskDialog
              isOpen={!!viewedTask}
              setIsOpen={(isOpen) => { if (!isOpen) setViewedTask(null); }}
              task={viewedTask}
            />
          )}
          <ShortcutHelpDialog open={isShortcutHelpOpen} onOpenChange={setIsShortcutHelpOpen} />
          <AudioHuddle />
        </div>
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
      <TaskProvider>
        <FilterProvider>
          <NotificationsProvider>
            <IdeaProvider>
              <GoalProvider>
                <ChecklistProvider>
                  <FCMProvider>
                    <CallProvider>
                      <PresenceProvider>
                          <AuthGuard>
                          <TourProvider>
                              {children}
                          </TourProvider>
                          </AuthGuard>
                      </PresenceProvider>
                    </CallProvider>
                  </FCMProvider>
                </ChecklistProvider>
              </GoalProvider>
            </IdeaProvider>
          </NotificationsProvider>
        </FilterProvider>
      </TaskProvider>
    </OrganizationProvider>
  );
}
