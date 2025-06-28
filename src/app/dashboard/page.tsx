
'use client';

import { useState, useMemo, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileDown, Download, FileText, HandHeart, MoreHorizontal, Group, Briefcase, ArrowUpNarrowWide, Columns } from 'lucide-react';
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
  const { user: currentUser, teams, currentOrganization, users, projects } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [isMeetingImporting, setIsMeetingImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [groupBy, setGroupBy] = useState<'status' | 'assignee' | 'priority' | 'project'>('status');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const searchTermMatch = searchTerm.toLowerCase()
        ? task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;

      const assigneeMatch = filters.assigneeId ? task.assigneeIds.includes(filters.assigneeId) : true;
      const labelMatch = filters.labels.length > 0 ? task.labels.every(label => task.labels.includes(label as Label)) : true;
      const priorityMatch = filters.priority ? task.priority === filters.priority : true;
      const teamMatch = filters.teamId ? task.teamId === filters.teamId : true;

      return searchTermMatch && assigneeMatch && labelMatch && priorityMatch && teamMatch;
    });
  }, [tasks, searchTerm, filters]);

  const choreOfTheWeek = useMemo(() => filteredTasks.find(t => t.isChoreOfTheWeek), [filteredTasks]);
  const helpNeededTasks = useMemo(() => filteredTasks.filter(t => t.helpNeeded), [filteredTasks]);
  
  const groupedTasks = useMemo(() => {
    const tasksToGroup = filteredTasks.filter(t => !t.isChoreOfTheWeek);

    if (groupBy === 'status') {
      const statuses = currentOrganization?.settings?.customization?.statuses || [];
      return statuses.map(status => ({
        title: status,
        tasks: tasksToGroup.filter(task => task.status === status).sort((a,b) => a.order - b.order)
      }));
    }
    if (groupBy === 'assignee') {
      const tasksByAssignee: Record<string, Task[]> = {};
      tasksToGroup.forEach(task => {
        if (task.assigneeIds.length === 0) {
          if (!tasksByAssignee['Niet toegewezen']) tasksByAssignee['Niet toegewezen'] = [];
          tasksByAssignee['Niet toegewezen'].push(task);
        } else {
          task.assigneeIds.forEach(id => {
            const user = users.find(u => u.id === id);
            const name = user ? user.name : 'Onbekende gebruiker';
            if (!tasksByAssignee[name]) tasksByAssignee[name] = [];
            tasksByAssignee[name].push(task);
          });
        }
      });
      const sortedEntries = Object.entries(tasksByAssignee).sort(([a], [b]) => a.localeCompare(b));
      return sortedEntries.map(([title, tasks]) => ({ title, tasks: tasks.sort((a,b) => a.order - b.order) }));
    }
    if (groupBy === 'priority') {
      const priorities = currentOrganization?.settings?.customization?.priorities || [];
      return priorities.map(priority => ({
        title: priority,
        tasks: tasksToGroup.filter(task => task.priority === priority).sort((a,b) => a.order - b.order)
      }));
    }
    if (groupBy === 'project') {
        const tasksByProject: Record<string, Task[]> = {};
        tasksToGroup.forEach(task => {
            const project = projects.find(p => p.id === task.projectId);
            const projectName = project ? project.name : 'Geen Project';
            if (!tasksByProject[projectName]) tasksByProject[projectName] = [];
            tasksByProject[projectName].push(task);
        });
        const sortedEntries = Object.entries(tasksByProject).sort(([a], [b]) => a.localeCompare(b));
        return sortedEntries.map(([title, tasks]) => ({ title, tasks: tasks.sort((a,b) => a.order - b.order) }));
    }
    return [];
  }, [filteredTasks, groupBy, currentOrganization, users, projects]);

  const regularTasks = useMemo(() => {
    return filteredTasks.filter(t => !t.isChoreOfTheWeek && !t.helpNeeded);
  }, [filteredTasks]);

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

  const groupByOptions = [
    { value: 'status', label: 'Status', icon: Columns },
    { value: 'assignee', label: 'Toegewezen aan', icon: Group },
    { value: 'priority', label: 'Prioriteit', icon: ArrowUpNarrowWide },
    { value: 'project', label: 'Project', icon: Briefcase },
  ]
  const CurrentGroupIcon = groupByOptions.find(o => o.value === groupBy)?.icon || Columns;

  if (loading) {
    return <TaskColumnsSkeleton />;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {showGettingStarted && <GettingStartedGuide />}
      {choreOfTheWeek && <ChoreOfTheWeekCard task={choreOfTheWeek} users={users} />}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Zoek taken..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-auto"
          />
          <FilterBar />
           {activeTab === 'board' && (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CurrentGroupIcon className="mr-2 h-4 w-4" />
                    Groeperen
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {groupByOptions.map(option => (
                      <DropdownMenuItem key={option.value} onSelect={() => setGroupBy(option.value as any)}>
                          <option.icon className="mr-2 h-4 w-4" />
                          {option.label}
                      </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
          )}
        </div>
        <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setIsMeetingImporting(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Importeer uit Notulen
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsImporting(true)}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Importeer Taken
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporteer naar CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          {groupedTasks.length > 0 ? (
            <TaskColumns groupedTasks={groupedTasks} groupBy={groupBy} users={users} currentUser={currentUser} projects={projects} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-full">
                <h3 className="text-2xl font-bold tracking-tight">Geen taken gevonden</h3>
                <p className="text-sm text-muted-foreground">Er zijn geen taken die aan de huidige filters voldoen.</p>
            </div>
          )}
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
