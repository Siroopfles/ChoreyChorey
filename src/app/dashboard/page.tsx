
'use client';
import dynamic from 'next/dynamic';
import { useTasks } from '@/contexts/task-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalendarView from '@/components/chorey/calendar-view';
import FilterBar from '@/components/chorey/filter-bar';
import DashboardViewSkeleton from '@/components/chorey/dashboard-view-skeleton';
import TaskColumnsSkeleton from '@/components/chorey/task-columns-skeleton';
import { LayoutGrid, CalendarDays, LayoutDashboard } from 'lucide-react';

const DashboardView = dynamic(() => import('@/components/chorey/dashboard-view'), {
  ssr: false,
  loading: () => <DashboardViewSkeleton />,
});

const TaskColumns = dynamic(() => import('@/components/chorey/task-columns'), {
    ssr: false,
    loading: () => <TaskColumnsSkeleton />,
});

export default function DashboardPage() {
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
