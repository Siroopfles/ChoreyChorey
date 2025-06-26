
'use client';

import { useState, useMemo, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import TaskColumnsSkeleton from '@/components/chorey/task-columns-skeleton';
import FilterBar from '@/components/chorey/filter-bar';
import { Input } from '@/components/ui/input';
import type { Task, User, Label, Priority, Team } from '@/lib/types';
import ImportTasksDialog from '@/components/chorey/import-tasks-dialog';
import DashboardView from '@/components/chorey/dashboard-view';
import DashboardViewSkeleton from '@/components/chorey/dashboard-view-skeleton';
import CalendarView from '@/components/chorey/calendar-view';
import TaskColumns from '@/components/chorey/task-columns';
import GanttView from '@/components/chorey/gantt-view';
import GanttViewSkeleton from '@/components/chorey/gantt-view-skeleton';

export default function DashboardPage() {
  const { tasks, users, loading, searchTerm, setSearchTerm, filters } = useTasks();
  const { user: currentUser, teams } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('board');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const searchTermMatch = searchTerm.toLowerCase()
        ? task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;

      const assigneeMatch = filters.assigneeId ? task.assigneeId === filters.assigneeId : true;
      const labelMatch = filters.labels.length > 0 ? filters.labels.every(label => task.labels.includes(label as Label)) : true;
      const priorityMatch = filters.priority ? task.priority === filters.priority : true;
      const teamMatch = filters.teamId ? task.teamId === filters.teamId : true;

      return searchTermMatch && assigneeMatch && labelMatch && priorityMatch && teamMatch;
    });
  }, [tasks, searchTerm, filters]);

  if (loading) {
    return <TaskColumnsSkeleton />;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Zoek taken..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-auto"
          />
          <FilterBar />
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsImporting(true)}>
                <FileDown className="mr-2 h-4 w-4" />
                Importeer Taken
            </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="board">Bord</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="calendar">Kalender</TabsTrigger>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="flex-1 mt-4 overflow-hidden">
          <TaskColumns tasks={filteredTasks} users={users} currentUser={currentUser} teams={teams} />
        </TabsContent>
        <TabsContent value="dashboard" className="flex-1 mt-4 overflow-y-auto">
           <Suspense fallback={<DashboardViewSkeleton />}>
              <DashboardView tasks={filteredTasks} users={users} />
           </Suspense>
        </TabsContent>
        <TabsContent value="calendar" className="flex-1 mt-4 overflow-y-auto">
          <CalendarView tasks={filteredTasks} users={users} />
        </TabsContent>
        <TabsContent value="gantt" className="flex-1 mt-4 overflow-y-auto">
           <Suspense fallback={<GanttViewSkeleton />}>
              <GanttView tasks={filteredTasks} />
           </Suspense>
        </TabsContent>
      </Tabs>
      <ImportTasksDialog open={isImporting} onOpenChange={setIsImporting} />
    </div>
  );
}
