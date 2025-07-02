

'use client';
import { useTasks } from '@/contexts/feature/task-context';
import { useAuth } from '@/contexts/user/auth-context';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, rectIntersection, useDroppable, useDndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableTaskCard } from './sortable-task-card';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { FileUp, Loader2, XCircle } from 'lucide-react';
import { addDays, isBefore, isToday, isWithinInterval, startOfDay } from 'date-fns';
import { useOrganization } from '@/contexts/system/organization-context';
import { cn } from '@/lib/utils/utils';
import { triggerHapticFeedback } from '@/lib/core/haptics';
import type { Task, Priority } from '@/lib/types/tasks';
import type { User } from '@/lib/types/auth';
import type { Project } from '@/lib/types/projects';


const TaskColumn = ({ 
  title, 
  tasks, 
  users, 
  currentUser, 
  projects, 
  allTasks
}: { 
  title: string; 
  tasks: Task[]; 
  users: User[], 
  currentUser: User | null, 
  projects: Project[],
  allTasks: Task[],
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: title,
  });
  const { active } = useDndContext();

  // Calculate dependencies based on currently loaded tasks
  const { blockingTasksMap, relatedTasksMap, blockedByTasksMap } = useMemo(() => {
    const blockingTasksMap = new Map<string, Task[]>();
    const relatedTasksMap = new Map<string, { taskId: string; type: "related_to" | "duplicate_of"; title?: string }[]>();
    const blockedByTasksMap = new Map<string, Task[]>();

    for (const task of allTasks) {
      if (task.blockedBy?.length) {
        task.blockedBy.forEach(blockerId => {
          if (!blockingTasksMap.has(blockerId)) {
            blockingTasksMap.set(blockerId, []);
          }
          blockingTasksMap.get(blockerId)!.push(task);
        });
        
        blockedByTasksMap.set(task.id, task.blockedBy.map(id => allTasks.find(t => t.id === id)).filter(Boolean) as Task[]);
      }

      if (task.relations?.length) {
        task.relations.forEach(relation => {
           // Link this task to the related one
          if (!relatedTasksMap.has(relation.taskId)) {
            relatedTasksMap.set(relation.taskId, []);
          }
          const reverseType = relation.type === 'duplicate_of' ? 'duplicate_of' : 'related_to';
          relatedTasksMap.get(relation.taskId)!.push({ taskId: task.id, type: reverseType, title: task.title });

          // Link the related one to this task
          if (!relatedTasksMap.has(task.id)) {
            relatedTasksMap.set(task.id, []);
          }
          const relatedTask = allTasks.find(t => t.id === relation.taskId);
          relatedTasksMap.get(task.id)!.push({ ...relation, title: relatedTask?.title });
        });
      }
    }
    return { blockingTasksMap, relatedTasksMap, blockedByTasksMap };
  }, [allTasks]);

  const isDraggingBlockedTask = active?.data?.current?.isBlocked ?? false;
  const isInvalidDropTarget = ['In Uitvoering', 'In Review', 'Voltooid'].includes(title);
  const showInvalidIndicator = isOver && isDraggingBlockedTask && isInvalidDropTarget;

  return (
    <div className="flex flex-col w-[320px] shrink-0 h-full">
      <div className="flex items-center gap-2 px-1 pb-2">
        <h2 className="text-base font-semibold font-headline text-foreground">{title}</h2>
        <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
       <SortableContext id={title} items={tasks} strategy={verticalListSortingStrategy}>
        <div 
            ref={setNodeRef}
            data-cy={`task-column-${title}`}
            role="group"
            aria-label={title}
            className={cn(
                "flex-grow space-y-3 p-2 overflow-y-auto rounded-md bg-muted min-h-[200px] transition-colors",
                showInvalidIndicator
                    ? "bg-destructive/10 ring-2 ring-destructive cursor-not-allowed"
                    : isOver
                    ? "bg-primary/10"
                    : ""
            )}
        >
            {tasks.length > 0 ? (
              tasks.map((task) => {
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
                  blockingTasks={blockingTasksMap.get(task.id) || []}
                  relatedTasks={relatedTasksMap.get(task.id) || []}
                  blockedByTasks={blockedByTasksMap.get(task.id) || []}
                  isOverdue={isOverdue}
                  isDueToday={isDueToday}
                  isDueSoon={isDueSoon}
                />
              )})
            ) : (
              <div
                className={cn(
                  'flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-all duration-300',
                  showInvalidIndicator
                    ? 'border-destructive/50 bg-destructive/5 text-destructive'
                    : isOver
                    ? 'border-primary bg-primary/10 text-primary scale-105'
                    : 'border-muted-foreground/20 text-muted-foreground/80'
                )}
              >
                {showInvalidIndicator ? (
                  <>
                    <XCircle className="h-10 w-10 transition-transform duration-300" />
                    <p className="mt-4 font-semibold">Actie niet toegestaan</p>
                    <p className="mt-1 text-xs">Geblokkeerde taken kunnen hier niet worden geplaatst.</p>
                  </>
                ) : (
                  <div className={cn("flex flex-col items-center justify-center transition-transform duration-300", isOver && "scale-110")}>
                    <FileUp className="h-10 w-10" />
                    <p className="mt-4 font-semibold">Sleep een taak hierheen</p>
                  </div>
                )}
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
  groupedTasks: GroupedTasks[];
  groupBy: 'status' | 'assignee' | 'priority' | 'project';
};

const TaskColumns = ({ groupedTasks, groupBy }: TaskColumnsProps) => {
  const { tasks, updateTask, reorderTasks, addTask } = useTasks();
  const { users, projects } = useOrganization();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const [isDragOver, setIsDragOver] = useState(false);
  
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
      if (activeTask.isBlocked && groupBy === 'status' && ['In Uitvoering', 'In Review', 'Voltooid'].includes(overContainer)) {
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
      triggerHapticFeedback(20);
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
      const result = await addTask({ title: file.name });
      if (result) {
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
                    allTasks={tasks}
                  />
              ))}
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
