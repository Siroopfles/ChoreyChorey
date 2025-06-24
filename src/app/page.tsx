'use client';
import { USERS } from '@/lib/data';
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
import { Search, LayoutGrid, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TaskProvider, useTasks } from '@/contexts/task-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalendarView from '@/components/chorey/calendar-view';


function MainContent() {
  const { tasks } = useTasks();
  const users = USERS;

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

export default function Home() {
  const users = USERS;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <h1 className="text-2xl font-bold text-sidebar-primary">Chorey</h1>
        </SidebarHeader>
        <SidebarContent className="p-4 flex flex-col">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Zoek taken..."
              className="pl-8 w-full bg-sidebar-accent border-sidebar-border"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
             <Leaderboard users={users} />
          </div>
        </SidebarContent>
      </Sidebar>
      <TaskProvider>
        <SidebarInset className="flex flex-col">
          <AppHeader users={users} />
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <MainContent />
          </main>
        </SidebarInset>
      </TaskProvider>
    </SidebarProvider>
  );
}
