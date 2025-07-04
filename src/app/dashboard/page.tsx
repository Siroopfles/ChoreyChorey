
'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useAuth } from '@/contexts/user/auth-context';
import { useOrganization } from '@/contexts/system/organization-context';
import { useTasks } from '@/contexts/feature/task-context';
import { useFilters } from '@/contexts/system/filter-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileDown, Download, FileText, HandHeart, MoreHorizontal, Group, Briefcase, ArrowUpNarrowWide, Columns, CalendarIcon, Settings2, ClipboardList } from 'lucide-react';
import TaskColumnsSkeleton from '@/components/chorey/common/task-columns-skeleton';
import FilterBar from '@/components/chorey/common/filter-bar';
import { Input } from '@/components/ui/input';
import type { Task, ActivityFeedItem } from '@/lib/types';
import ImportTasksDialog from '@/components/chorey/dialogs/import-tasks-dialog';
import MeetingImportDialog from '@/components/chorey/dialogs/meeting-import-dialog';
import DashboardView from '@/components/chorey/views/dashboard-view';
import DashboardViewSkeleton from '@/components/chorey/common/dashboard-view-skeleton';
import CalendarView from '@/components/chorey/views/calendar-view';
import TaskColumns from '@/components/chorey/common/task-columns';
import GanttView from '@/components/chorey/views/gantt-view';
import GanttViewSkeleton from '@/components/chorey/common/gantt-view-skeleton';
import TaskListView from '@/components/chorey/views/task-list-view';
import Papa from 'papaparse';
import { ChoreOfTheWeekCard } from '@/components/chorey/common/chore-of-the-week-card';
import { getPublicActivityFeed } from '@/app/actions/core/gamification.actions';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils/utils';
import { ManageDashboardDialog } from '@/components/chorey/dashboard/ManageDashboardDialog';

export default function DashboardRootPage() {
  const { 
    loading: tasksLoading,
    filteredTasks,
    groupedTasks,
    groupBy,
    setGroupBy
  } = useTasks();
  const { searchTerm, setSearchTerm, setDateRange, dateRange } = useFilters();
  const { users, projects } = useOrganization();
  const [isImporting, setIsImporting] = useState(false);
  const [isMeetingImporting, setIsMeetingImporting] = useState(false);
  const [isDashboardManagerOpen, setIsDashboardManagerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [activityFeedItems, setActivityFeedItems] = useState<ActivityFeedItem[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const { toast } = useToast();
  const { currentOrganization } = useAuth();


  useEffect(() => {
    if (currentOrganization) {
        setIsFeedLoading(true);
        getPublicActivityFeed(currentOrganization.id)
            .then(result => {
                if (result.error) {
                    toast({ title: "Fout bij laden feed", description: result.error, variant: 'destructive'});
                } else if (result.data) {
                    setActivityFeedItems(result.data.feed);
                }
            })
            .finally(() => setIsFeedLoading(false));
    }
  }, [currentOrganization, toast]);

  const choreOfTheWeek = useMemo(() => filteredTasks.find(t => t.isChoreOfTheWeek), [filteredTasks]);
  const helpNeededTasks = useMemo(() => filteredTasks.filter(t => t.helpNeeded), [filteredTasks]);
  
  const regularTasks = useMemo(() => {
    return filteredTasks.filter(t => !t.isChoreOfTheWeek && !t.helpNeeded);
  }, [filteredTasks]);

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

  return (
    <div className="flex flex-col h-full gap-4">
      {choreOfTheWeek && <ChoreOfTheWeekCard task={choreOfTheWeek} />}
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
          {activeTab === 'dashboard' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant="outline" size="sm" className={cn(!dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y", { locale: nl })} -{" "}
                        {format(dateRange.to, "LLL dd, y", { locale: nl })}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y", { locale: nl })
                    )
                  ) : (
                    <span>Filter op datum</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDashboardManagerOpen(true)}>
              <Settings2 className="h-4 w-4 mr-2" />
              Beheer Dashboard
            </Button>
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
          {tasksLoading ? (
            <TaskColumnsSkeleton />
          ) : groupedTasks.length > 0 ? (
            <TaskColumns groupedTasks={groupedTasks} groupBy={groupBy} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-full">
                <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-2xl font-bold tracking-tight">Geen taken gevonden</h3>
                <p className="mt-2 text-sm text-muted-foreground">Er zijn geen taken die aan de huidige filters voldoen.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="list" className="flex-1 mt-4 overflow-y-auto">
          <TaskListView tasks={regularTasks} />
        </TabsContent>
        <TabsContent value="help" className="flex-1 mt-4 overflow-y-auto">
          <TaskListView tasks={helpNeededTasks} />
        </TabsContent>
        <TabsContent value="dashboard" className="flex-1 mt-4 overflow-y-auto">
           <Suspense fallback={<DashboardViewSkeleton />}>
              <DashboardView
                tasks={filteredTasks}
                activityFeedItems={activityFeedItems}
                isFeedLoading={isFeedLoading}
              />
           </Suspense>
        </TabsContent>
        <TabsContent value="calendar" className="flex-1 mt-4 overflow-y-auto">
          <CalendarView tasks={filteredTasks} />
        </TabsContent>
        <TabsContent value="gantt" className="flex-1 mt-4 overflow-y-auto">
           <Suspense fallback={<GanttViewSkeleton />}>
              <GanttView tasks={filteredTasks} />
           </Suspense>
        </TabsContent>
      </Tabs>
      <ImportTasksDialog open={isImporting} onOpenChange={setIsImporting} />
      <MeetingImportDialog open={isMeetingImporting} onOpenChange={setIsMeetingImporting} />
      <ManageDashboardDialog open={isDashboardManagerOpen} onOpenChange={setIsDashboardManagerOpen} />
    </div>
  );
}
