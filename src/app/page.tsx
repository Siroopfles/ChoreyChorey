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

export default function Home() {
  // In a real app, users and tasks would be fetched from an API
  // and managed with state. For this prototype, we use static data.
  const users = USERS;
  const tasks = TASKS;

  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <Sidebar>
          <SidebarHeader className="p-4">
            <h1 className="text-2xl font-bold font-headline text-primary">Chorey</h1>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <Leaderboard users={users} />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <AppHeader users={users} />
          <main className="p-4 sm:p-6 lg:p-8">
            <Tabs defaultValue="board" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="board">Board</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
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
