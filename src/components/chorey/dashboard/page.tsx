
'use client';

import { useState, useMemo, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileDown, Download, FileText, HandHeart } from 'lucide-react';
import TaskColumnsSkeleton from '@/components/chorey/task-columns-skeleton';
import FilterBar from '@/components/chorey/filter-bar';
import { Input } from '@/components/ui/input';
import type { Task, User, Label, Priority, Project } from '@/lib/types';
import ImportTasksDialog from '@/components/chorey/import-tasks-dialog';
import MeetingImportDialog from '@/components/chorey/meeting-import-dialog';
import DashboardView from '@/components/chorey/dashboard-view';
import DashboardViewSkeleton from '@/components/chorey/dashboard-view-skeleton';
import CalendarView from '@/components/chorey/calendar-view';
import TaskColumns from '@/components/chorey/task-columns';
import GanttView from '@/components/chorey/gantt-view';
import GanttViewSkeleton from '@/components/chorey/gantt-view-skeleton';
import TaskListView from '@/components/chorey/task-list-view';
import Papa from 'papaparse';
import { ChoreOfTheWeekCard } from '@/components/chorey/chore-of-the-week-card';
import { GettingStartedGuide } from '@/components/chorey/getting-started-guide';

export default function DashboardPage() {
  const { tasks, loading, searchTerm, setSearchTerm, filters } = useTasks();
  const { user: currentUser, projects, currentOrganization, users } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [isMeetingImporting, setIsMeetingImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('board');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const searchTermMatch = searchTerm.toLowerCase()
        ? task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;

      const assigneeMatch = filters.assigneeId ? task.assigneeIds.includes(filters.assigneeId) : true;
      const labelMatch = filters.labels.length > 0 ? task.labels.every(label => task.labels.includes(label as Label)) : true;
      const priorityMatch = filters.priority ? task.priority === filters.priority : true;
      const projectMatch = filters.projectId ? task.projectId === filters.projectId : true;

      return searchTermMatch && assigneeMatch && labelMatch && priorityMatch && projectMatch;
    });
  }, [tasks, searchTerm, filters]);

  const choreOfTheWeek = useMemo(() => filteredTasks.find(t => t.isChoreOfTheWeek), [filteredTasks]);
  const regularTasks = useMemo(() => filteredTasks.filter(t => !t.isChoreOfTheWeek), [filteredTasks]);
  const helpNeededTasks = useMemo(() => regularTasks.filter(t => t.helpNeeded), [regularTasks]);

  const showGettingStarted = useMemo(() => {
    return currentOrganization && users.length === 1 && currentUser?.id === currentOrganization.ownerId;
  }, [currentOrganization, users, currentUser]);


  const handleExport = () => {
    const dataToExport = filteredTasks.map(task => {
        const assignees = task.assigneeIds.map(id => users.find(u => u.id === id)?.name).filter(Boolean);
        return {
            ID: task.id,
            Titel: task.title,
            Omschrijving: task.description,
            Status: task.status,
            Prioriteit: task.priority,
            Labels: task.labels.join(', '),
            ToegewezenAan: assignees.join(', ') || 'N/A',
            Einddatum: task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'N/A',
            Aanmaakdatum: task.createdAt.toISOString().split('T')[0],
        };
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `chorey_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return <TaskColumnsSkeleton />;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {showGettingStarted && <GettingStartedGuide />}
      {choreOfTheWeek && <ChoreOfTheWeekCard task={choreOfTheWeek} users={users} />}
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
            <Button variant="outline" onClick={() => setIsMeetingImporting(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Importeer uit Notulen
            </Button>
            <Button variant="outline" onClick={() => setIsImporting(true)}>
                <FileDown className="mr-2 h-4 w-4" />
                Importeer Taken
            </Button>
             <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exporteer naar CSV
            </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="board">Bord</TabsTrigger>
          <TabsTrigger value="list">Lijst</TabsTrigger>
          <TabsTrigger value="help">
            <HandHeart className="mr-2 h-4 w-4"/>
            Hulp Gezocht
            {helpNeededTasks.length > 0 && <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full">{helpNeededTasks.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="calendar">Kalender</TabsTrigger>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="flex-1 mt-4 overflow-hidden">
          <TaskColumns tasks={regularTasks} users={users} currentUser={currentUser} projects={projects} />
        </TabsContent>
        <TabsContent value="list" className="flex-1 mt-4 overflow-y-auto">
          <TaskListView tasks={regularTasks} users={users} />
        </TabsContent>
        <TabsContent value="help" className="flex-1 mt-4 overflow-y-auto">
          <TaskListView tasks={helpNeededTasks} users={users} />
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
      <MeetingImportDialog open={isMeetingImporting} onOpenChange={setIsMeetingImporting} />
    </div>
  );
}
