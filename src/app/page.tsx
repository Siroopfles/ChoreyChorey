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
import TaskColumns from '@/components/chorey/task-columns';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Home() {
  const users = USERS;
  const tasks = TASKS;

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
      <SidebarInset className="flex flex-col">
        <AppHeader users={users} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <TaskColumns tasks={tasks} users={users} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
