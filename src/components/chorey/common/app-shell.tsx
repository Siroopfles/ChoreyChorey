
'use client';

import { usePresence } from '@/contexts/communication/presence-context';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppHeader from '@/components/chorey/common/app-header';
import AddTaskDialog from '@/components/chorey/dialogs/add-task-dialog';
import EditTaskDialog from '@/components/chorey/dialogs/edit-task-dialog';
import AnnouncementBanner from '@/components/chorey/common/announcement-banner';
import { ShortcutHelpDialog } from '@/components/chorey/dialogs/shortcut-help-dialog';
import { AudioHuddle } from '@/components/chorey/audio-huddle/AudioHuddle';
import { SidebarInset } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import AppSidebar from '@/components/chorey/common/app-sidebar';
import MobileBottomNav from '@/components/chorey/common/mobile-bottom-nav';
import { cn } from '@/lib/utils/utils';
import BulkActionBar from '@/components/chorey/common/bulk-action-bar';
import { LiveCursors } from '@/components/chorey/common/live-cursors';
import type { UserStatus } from '@/lib/types';
import { isToday } from 'date-fns';
import { sendDailyDigest } from '@/app/actions/core/digest.actions';
import { useView } from '@/contexts/system/view-context';
import { useAuth } from '@/contexts/user/auth-context';
import { useOrganization } from '@/contexts/system/organization-context';
import { useTasks } from '@/contexts/feature/task-context';

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
  const cosmetic = user?.cosmetic || {};

  const fontMap = {
    'pt-sans': 'var(--font-pt-sans)', // Default
    'source-sans-pro': 'var(--font-source-sans-pro)',
    'roboto-mono': 'var(--font-roboto-mono)',
  }

  const styles = [];
  if (cosmetic.primaryColor) styles.push(`--primary: ${cosmetic.primaryColor};`);
  if (cosmetic.accent) styles.push(`--accent: ${cosmetic.accent};`);
  if (cosmetic.radius) styles.push(`--radius: ${cosmetic.radius}rem;`);
  if (cosmetic.font && fontMap[cosmetic.font as keyof typeof fontMap]) {
    const fontValue = fontMap[cosmetic.font as keyof typeof fontMap];
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
export default function AppShell({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { updateUserPresence } = usePresence();
    const { currentOrganization } = useOrganization();
    const { tasks } = useTasks();
    const { isAddTaskDialogOpen, setIsAddTaskDialogOpen, viewedTask, setViewedTask } = useView();

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
        } else if (pathname.includes('/dashboard')) {
            const pageName = pathname.split('/').pop() || 'dashboard';
            currentPage = `Op pagina: ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`;
        } else {
             currentPage = `Op pagina: ${pathname.split('/').pop() || 'onbekend'}`;
        }
        
        const presenceUpdate: Partial<UserStatus> = { currentPage };
        updateUserPresence(presenceUpdate);

    }, [pathname, viewedTask, updateUserPresence, tasks]);

     // Effect to trigger daily digest
    useEffect(() => {
        if (!user || !currentOrganization) return;
        const digestSettings = currentOrganization.members[user.id]?.notificationSettings;
        if (!digestSettings?.dailyDigestEnabled) return;

        const lastSent = user.lastDigestSentAt;
        const now = new Date();
        // Check if digest hasn't been sent today and it's after 9 AM.
        if ((!lastSent || !isToday(lastSent)) && now.getHours() >= 9) {
            sendDailyDigest(user.id, currentOrganization.id);
        }
    }, [user, currentOrganization]);


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
    <>
      <BrandingStyle />
      <UserCosmeticStyle />
      <AppSidebar />
      <SidebarInset className={cn(isMobile ? 'pb-16' : '')}>
        <AppHeader />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          {announcement && <AnnouncementBanner announcement={announcement} />}
          {children}
          <LiveCursors />
        </div>
        <BulkActionBar />
      </SidebarInset>
      <MobileBottomNav />

      <AddTaskDialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen} />
      {viewedTask && (
        <EditTaskDialog
          isOpen={!!viewedTask}
          setIsOpen={(isOpen) => {
            if (!isOpen) setViewedTask(null);
          }}
          task={viewedTask}
        />
      )}
      <ShortcutHelpDialog open={isShortcutHelpOpen} onOpenChange={setIsShortcutHelpOpen} />
      <AudioHuddle />
    </>
    );
}
