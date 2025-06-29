
'use client';
import type { User, Task, Project, Priority } from '@/lib/types';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, rectIntersection, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableTaskCard } from '@/components/chorey/sortable-task-card';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { addDays, isBefore, isToday, isWithinInterval, startOfDay } from 'date-fns';
import { useInView } from 'react-intersection-observer';

const TaskColumn = ({ 
  title, 
  tasks, 
  users, 
  currentUser, 
  projects, 
  isBlockedMap, 
  blockingTasksMap, 
  relatedTasksMap, 
  blockedByTasksMap 
}: { 
  title: string; 
  tasks: Task[]; 
  users: User[], 
  currentUser: User | null, 
  projects: Project[],
  isBlockedMap: Map<string, boolean>,
  blockingTasksMap: Map<string, Task[]>,
  relatedTasksMap: Map<string, { taskId: string; type: "related_to" | "duplicate_of"; title?: string }[]>,
  blockedByTasksMap: Map<string, Task[]>,
}) => {
  const { setNodeRef } = useDroppable({
    id: title,
  });

  return (
    <div className="flex flex-col w-[320px] shrink-0 h-full">
      <div className="flex items-center gap-2 px-1 pb-2">
        <h2 className="text-base font-semibold font-headline text-foreground">{title}</h2>
        <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
       <SortableContext id={title} items={tasks} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex-grow space-y-3 p-2 overflow-y-auto rounded-md bg-muted min-h-[200px]">
            {tasks.map((task) => {
              const today = new Date();
              const isOverdue = task.dueDate ? isBefore(startOfDay(task.dueDate), startOfDay(today)) : false;
              const isDueToday = task.dueDate ? isToday(task.dueDate) : false;
              const isDueSoon = task.dueDate ? !isDueToday && !isOverdue && isWithinInterval(task.dueDate, { start: today, end: addDays(today, 7) }) : false;
              
              return (
              <SortableTaskCard 
                key={task.id} 
                task={task} 
                users={users} 
                currentUser={currentUser} 
                projects={projects}
                isBlocked={isBlockedMap.get(task.id) || false}
                blockingTasks={blockingTasksMap.get(task.id) || []}
                relatedTasks={relatedTasksMap.get(task.id) || []}
                blockedByTasks={blockedByTasksMap.get(task.id) || []}
                isOverdue={isOverdue}
                isDueToday={isDueToday}
                isDueSoon={isDueSoon}
              />
            )})}
            {tasks.length === 0 && (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground/80 pointer-events-none">
                Sleep een taak hierheen.
            </div>
            )}
        </div>
      </SortableContext>
    </div>
  );
};

type GroupedTasks = {
  title: string;
  tasks: Task[];
}

type TaskColumnsProps = {
  users: User[];
  groupedTasks: GroupedTasks[];
  groupBy: 'status' | 'assignee' | 'priority' | 'project';
  currentUser: User | null;
  projects: Project[];
  isBlockedMap: Map<string, boolean>;
  blockingTasksMap: Map<string, Task[]>;
  relatedTasksMap: Map<string, { taskId: string; type: "related_to" | "duplicate_of"; title?: string }[]>;
  blockedByTasksMap: Map<string, Task[]>;
};

const TaskColumns = ({ users, groupedTasks, groupBy, currentUser, projects, isBlockedMap, blockingTasksMap, relatedTasksMap, blockedByTasksMap }: TaskColumnsProps) => {
  const { tasks, updateTask, reorderTasks, addTask, loadMoreTasks, hasMoreTasks, isMoreLoading } = useTasks();
  const { toast } = useToast();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '400px',
  });

  useEffect(() => {
    if (inView && !isMoreLoading) {
      loadMoreTasks();
    }
  }, [inView, isMoreLoading, loadMoreTasks]);


  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeContainer = active.data.current?.sortable.containerId as string;
    const overContainer = (over.data.current?.sortable.containerId || over.id) as string;
    
    if (!activeContainer || !overContainer) {
      return;
    }
    
    if (activeId === overId && activeContainer === overContainer) {
        return;
    }

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    if (activeContainer !== overContainer) {
      if (active.data.current?.isBlocked && groupBy === 'status' && ['In Uitvoering', 'In Review', 'Voltooid'].includes(overContainer)) {
        toast({
          title: 'Taak Geblokkeerd',
          description: 'Deze taak kan niet worden gestart omdat een afhankelijke taak nog niet is voltooid.',
          variant: 'destructive',
        });
        return;
      }
      
      let updates: Partial<Task> = { order: Date.now() };

      switch (groupBy) {
        case 'status':
            updates.status = overContainer;
            break;
        case 'assignee':
            const assignee = users.find(u => u.name === overContainer);
            updates.assigneeIds = assignee ? [assignee.id] : [];
            break;
        case 'priority':
            updates.priority = overContainer as Priority;
            break;
        case 'project':
            const project = projects.find(p => p.name === overContainer);
            updates.projectId = project ? project.id : null;
            break;
      }

      updateTask(activeId, updates);

    } else {
      const itemsInColumn = groupedTasks.find(g => g.title === activeContainer)?.tasks || [];
      const oldIndex = itemsInColumn.findIndex((t) => t.id === activeId);
      const newIndex = itemsInColumn.findIndex((t) => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reorderedTasks = arrayMove(itemsInColumn, oldIndex, newIndex);
        const tasksToUpdate = reorderedTasks.map((task, index) => ({
            id: task.id,
            order: index
        }));
        reorderTasks(tasksToUpdate);
      }
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) {
      return;
    }

    let successCount = 0;
    for (const file of files) {
      const success = await addTask({ title: file.name });
      if (success) {
        successCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: 'Taken aangemaakt!',
        description: `${successCount} taak/taken aangemaakt op basis van de gesleepte bestanden.`,
      });
    }
  };


  return (
     <DndContext 
      sensors={sensors} 
      onDragEnd={handleDragEnd} 
      collisionDetection={rectIntersection}
    >
        <div
          className="relative h-full"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <ScrollArea className="w-full h-full">
          <div className="flex gap-6 pb-4 h-full">
              {groupedTasks.map((group) => (
                  <TaskColumn 
                    key={group.title} 
                    title={group.title} 
                    tasks={group.tasks} 
                    users={users} 
                    currentUser={currentUser} 
                    projects={projects}
                    isBlockedMap={isBlockedMap}
                    blockingTasksMap={blockingTasksMap}
                    relatedTasksMap={relatedTasksMap}
                    blockedByTasksMap={blockedByTasksMap}
                  />
              ))}
              {hasMoreTasks && (
                <div ref={ref} className="flex w-[320px] shrink-0 items-center justify-center">
                  {isMoreLoading && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}
                </div>
              )}
          </div>
          <ScrollBar orientation="horizontal" />
          </ScrollArea>
           {isDragOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 border-2 border-dashed border-primary rounded-lg pointer-events-none transition-opacity duration-200">
              <FileUp className="h-16 w-16 text-primary" />
              <p className="mt-4 text-lg font-semibold text-primary">Sleep bestanden hierheen om taken te maken</p>
            </div>
          )}
        </div>
    </DndContext>
  );
};

export default TaskColumns;
