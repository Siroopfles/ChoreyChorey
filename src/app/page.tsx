import { USERS, TASKS } from '@/lib/data';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/ui/sidebar';
import Leaderboard from '@/components/chorey/leaderboard';
import AppHeader from '@/components/chorey/app-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskColumns from '@/components/chorey/task-columns';
import CalendarView from '@/components/chorey/calendar-view';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Home() {
  const users = USERS;
  const tasks = TASKS;

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar>
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <h1 className="text-2xl font-bold text-sidebar-primary">Chorey</h1>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Zoek taken..."
                className="pl-8 w-full bg-sidebar-accent border-sidebar-border"
              />
            </div>
            <Leaderboard users={users} />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <AppHeader users={users} />
          <main className="p-4 sm:p-6 lg:p-8 bg-muted/40 flex-1">
            <Tabs defaultValue="board" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="board">Bord</TabsTrigger>
                <TabsTrigger value="calendar">Kalender</TabsTrigger>
              </TabsList>
              <TabsContent value="board">
                <TaskColumns tasks={tasks} users={users} />
              </TabsContent>
              <TabsContent value="calendar">
                <Card>
                  <CardContent className="p-2 sm:p-4">
                    <CalendarView tasks={tasks} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
