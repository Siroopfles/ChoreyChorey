
'use client';
import dynamic from 'next/dynamic';
import { useTasks } from '@/contexts/task-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalendarView from '@/components/chorey/calendar-view';
import FilterBar from '@/components/chorey/filter-bar';
import DashboardViewSkeleton from '@/components/chorey/dashboard-view-skeleton';
import TaskColumnsSkeleton from '@/components/chorey/task-columns-skeleton';
import { LayoutGrid, CalendarDays, LayoutDashboard, Download, GanttChart, FileImport } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import ImportTasksDialog from '@/components/chorey/import-tasks-dialog';
import GanttViewSkeleton from '@/components/chorey/gantt-view-skeleton';
import { useAuth } from '@/contexts/auth-context';
import type { User } from '@/lib/types';

const DashboardView = dynamic(() => import('@/components/chorey/dashboard-view'), {
  ssr: false,
  loading: () => <DashboardViewSkeleton />,
});

const TaskColumns = dynamic(() => import('@/components/chorey/task-columns'), {
    ssr: false,
    loading: () => <TaskColumnsSkeleton />,
});

const GanttView = dynamic(() => import('@/components/chorey/gantt-view'), {
  ssr: false,
  loading: () => <GanttViewSkeleton />,
});

export default function DashboardPage() {
  const { tasks, users, searchTerm, filters } = useTasks();
  const { user: currentUser, teams } = useAuth();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
        const term = searchTerm.toLowerCase();
        const inSearch = searchTerm ? 
            task.title.toLowerCase().includes(term) ||
            (task.description && task.description.toLowerCase().includes(term))
            : true;
        
        const inAssignee = filters.assigneeId ? task.assigneeId === filters.assigneeId : true;
        const inLabels = filters.labels.length > 0 ? filters.labels.every(l => task.labels.includes(l)) : true;
        const inPriority = filters.priority ? task.priority === filters.priority : true;
        const inTeam = filters.teamId ? task.teamId === filters.teamId : true;

        return inSearch && inAssignee && inLabels && inPriority && inTeam;
      });
  }, [tasks, searchTerm, filters]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Assignee', 'DueDate', 'Labels', 'URL'];
    const userMap = new Map(users.map(u => [u.id, u.name]));
    
    const rows = filteredTasks.map(task => [
        task.id,
        `"${task.title.replace(/"/g, '""')}"`,
        task.status,
        task.priority,
        task.assigneeId ? userMap.get(task.assigneeId) || 'Unknown' : 'Unassigned',
        task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '',
        task.labels.join(', '),
        `${window.location.origin}/dashboard?taskId=${task.id}`
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "chorey_tasks_export.csv");
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
    <Tabs defaultValue="board" className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <TabsList className="grid w-full grid-cols-4 md:w-fit">
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
           <TabsTrigger value="gantt">
            <GanttChart className="mr-2 h-4 w-4" />
            Gantt
          </TabsTrigger>
        </TabsList>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <FilterBar />
            <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
              <FileImport className="mr-2 h-4 w-4" />
              Importeren
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exporteren
            </Button>
        </div>
      </div>
      <TabsContent value="board">
        <TaskColumns users={users} tasks={filteredTasks} currentUser={currentUser} teams={teams} />
      </TabsContent>
      <TabsContent value="calendar">
        <div className="rounded-lg border bg-card">
          <CalendarView tasks={tasks} users={users} />
        </div>
      </TabsContent>
      <TabsContent value="dashboard">
        <DashboardView tasks={tasks} users={users} />
      </TabsContent>
       <TabsContent value="gantt">
          <GanttView tasks={filteredTasks} />
      </TabsContent>
    </Tabs>
    <ImportTasksDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} />
    </>
  );
}
