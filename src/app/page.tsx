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
import { LayoutGrid, CalendarDays } from 'lucide-react';
import CommandBar from '@/components/chorey/command-bar';
import { TaskProvider, useTasks } from '@/contexts/task-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalendarView from '@/components/chorey/calendar-view';
import BulkActionBar from '@/components/chorey/bulk-action-bar';


function MainContent() {
  const { tasks, users } = useTasks();

  return (
    <Tabs defaultValue="board" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4 md:w-fit">
        <TabsTrigger value="board">
          <LayoutGrid className="mr-2 h-4 w-4" />
          Bord
        </TabsTrigger>
        <TabsTrigger value="calendar">
          <CalendarDays className="mr-2 h-4 w-4" />
          Kalender
        </TabsTrigger>
      </TabsList>
      <TabsContent value="board">
        <TaskColumns users={users} />
      </TabsContent>
      <TabsContent value="calendar">
        <div className="p-4 bg-card rounded-lg border max-w-fit mx-auto">
          <CalendarView tasks={tasks} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function ChoreyApp() {
  const { users } = useTasks();
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
    </SidebarProvider>
  )
}

export default function Home() {
  return (
    <TaskProvider>
      <ChoreyApp />
    </TaskProvider>
  );
}
