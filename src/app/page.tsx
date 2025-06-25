'use client';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/ui/sidebar';
import Leaderboard from '@/components/chorey/leaderboard';
import AppHeader from '@/components/chorey/app-header';
import TaskColumns from '@/components/chorey/task-columns';
import { LayoutGrid, CalendarDays, LayoutDashboard, Loader2 } from 'lucide-react';
import CommandBar from '@/components/chorey/command-bar';
import { useTasks } from '@/contexts/task-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalendarView from '@/components/chorey/calendar-view';
import BulkActionBar from '@/components/chorey/bulk-action-bar';
import DashboardView from '@/components/chorey/dashboard-view';
import FilterBar from '@/components/chorey/filter-bar';
import UserProfileSheet from '@/components/chorey/user-profile-sheet';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';


function MainContent() {
  const { tasks, users } = useTasks();

  return (
    <Tabs defaultValue="board" className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <TabsList className="grid w-full grid-cols-3 md:w-fit">
          <TabsTrigger value="board">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Bord
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="mr-2 h-4 w-4" />
            Kalender
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>
        <div className="w-full md:w-auto">
            <FilterBar />
        </div>
      </div>
      <TabsContent value="board">
        <TaskColumns users={users} />
      </TabsContent>
      <TabsContent value="calendar">
        <div className="rounded-lg border bg-card">
          <CalendarView tasks={tasks} users={users} />
        </div>
      </TabsContent>
      <TabsContent value="dashboard">
        <DashboardView tasks={tasks} users={users} />
      </TabsContent>
    </Tabs>
  );
}

function ChoreyApp() {
  const { users, viewedUser, setViewedUser } = useTasks();
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <h1 className="text-2xl font-bold text-sidebar-primary">Chorey</h1>
        </SidebarHeader>
        <SidebarContent className="p-4 flex flex-col">
          <CommandBar users={users} />
          <div className="flex-1 overflow-y-auto mt-4">
              <Leaderboard users={users} />
          </div>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <AppHeader users={users} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 relative">
          <MainContent />
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
    </SidebarProvider>
  )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return null;
}


export default function Home() {
  return (
    <AuthGuard>
      <ChoreyApp />
    </AuthGuard>
  );
}
