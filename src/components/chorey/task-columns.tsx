'use client';
import type { User, Status, Task } from '@/lib/types';
import { useTasks } from '@/contexts/task-context';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, rectIntersection, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableTaskCard } from '@/components/chorey/sortable-task-card';
import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';

const TaskColumn = ({ title, tasks, users }: { title: Status; tasks: Task[]; users: User[] }) => {
  return (
    <div className="flex flex-col w-[320px] shrink-0">
      <div className="flex items-center gap-2 px-1 pb-2">
        <h2 className="text-base font-semibold font-headline text-foreground">{title}</h2>
        <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
       <SortableContext id={title} items={tasks} strategy={verticalListSortingStrategy}>
        <div className="flex-grow space-y-3 p-2 overflow-y-auto rounded-md bg-muted min-h-[200px]">
            {tasks.length > 0 ? (
            tasks.map((task) => <SortableTaskCard key={task.id} task={task} users={users} />)
            ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground/80">
                Geen taken hier.
            </div>
            )}
        </div>
      </SortableContext>
    </div>
  );
};

type TaskColumnsProps = {
  users: User[];
};

const TaskColumns = ({ users }: TaskColumnsProps) => {
  const { tasks, searchTerm, filters, updateTask, reorderTasks } = useTasks();
  const { toast } = useToast();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns: Status[] = ["Te Doen", "In Uitvoering", "In Review", "Voltooid", "Geannuleerd", "Gearchiveerd"];

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

        return inSearch && inAssignee && inLabels && inPriority;
      });
  }, [tasks, searchTerm, filters]);


  const tasksByStatus = (status: Status) => {
    return filteredTasks
        .filter((task) => task.status === status)
        .sort((a,b) => a.order - b.order);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    const activeContainer = active.data.current?.sortable.containerId as Status;
    let overContainer = over.data.current?.sortable.containerId as Status;

    if(!overContainer) {
        // This case handles dropping on a column directly, not on another card
        if (columns.includes(over.id as Status)) {
            overContainer = over.id as Status;
        } else {
            return;
        }
    }

    const isBlocked = activeTask.blockedBy?.some(blockerId => {
        const blockerTask = tasks.find(t => t.id === blockerId);
        return blockerTask && blockerTask.status !== 'Voltooid';
    });

    if (isBlocked && ['In Uitvoering', 'In Review', 'Voltooid'].includes(overContainer)) {
        toast({
            title: 'Taak Geblokkeerd',
            description: 'Deze taak kan niet worden gestart omdat een van de afhankelijke taken nog niet is voltooid.',
            variant: 'destructive',
        });
        return;
    }

    if (activeContainer !== overContainer) {
      // Task is moved to a different column
      updateTask(activeId, { status: overContainer, order: Date.now() });
    } else if (activeId !== overId) {
      // Task is reordered within the same column
      const tasksInColumn = tasksByStatus(activeContainer);
      const oldIndex = tasksInColumn.findIndex(t => t.id === activeId);
      const newIndex = tasksInColumn.findIndex(t => t.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedTasks = arrayMove(tasksInColumn, oldIndex, newIndex);
        const tasksToUpdate = reorderedTasks.map((task, index) => ({
            id: task.id,
            order: index
        }));
        reorderTasks(tasksToUpdate);
      }
    }
  }

  return (
     <DndContext 
      sensors={sensors} 
      onDragEnd={handleDragEnd} 
      collisionDetection={closestCenter}
    >
        <ScrollArea className="w-full">
        <div className="flex gap-6 pb-4">
            {columns.map((status) => (
                <TaskColumn key={status} title={status} tasks={tasksByStatus(status)} users={users} />
            ))}
        </div>
        <ScrollBar orientation="horizontal" />
        </ScrollArea>
    </DndContext>
  );
};

export default TaskColumns;
