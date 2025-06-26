
'use client';
import type { User, Status, Task, Team } from '@/lib/types';
import { useTasks } from '@/contexts/task-context';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, rectIntersection } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableTaskCard } from '@/components/chorey/sortable-task-card';
import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';

const TaskColumn = ({ title, tasks, users, currentUser, teams }: { title: Status; tasks: Task[]; users: User[], currentUser: User | null, teams: Team[] }) => {
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
            tasks.map((task) => <SortableTaskCard key={task.id} task={task} users={users} currentUser={currentUser} teams={teams} />)
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
  tasks: Task[];
  currentUser: User | null;
  teams: Team[];
};

const TaskColumns = ({ users, tasks: filteredTasks, currentUser, teams }: TaskColumnsProps) => {
  const { tasks, updateTask, reorderTasks } = useTasks();
  const { toast } = useToast();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns: Status[] = ["Te Doen", "In Uitvoering", "In Review", "Voltooid"];

  const tasksByStatus = (status: Status) => {
    return filteredTasks
        .filter((task) => task.status === status)
        .sort((a,b) => a.order - b.order);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) {
      return;
    }

    const activeContainer = active.data.current?.sortable.containerId as Status;
    const overContainer = (over.data.current?.sortable.containerId || over.id) as Status;
    
    if (!activeContainer || !overContainer || !columns.includes(overContainer)) {
      return;
    }

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Handle moving to a NEW column
    if (activeContainer !== overContainer) {
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
      
      updateTask(activeId, { status: overContainer, order: Date.now() });

    } else { // Handle reordering WITHIN the same column
      const itemsInColumn = tasksByStatus(activeContainer);
      const oldIndex = itemsInColumn.findIndex((t) => t.id === activeId);
      const newIndex = itemsInColumn.findIndex((t) => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedTasks = arrayMove(itemsInColumn, oldIndex, newIndex);
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
      collisionDetection={rectIntersection}
    >
        <ScrollArea className="w-full">
        <div className="flex gap-6 pb-4">
            {columns.map((status) => (
                <TaskColumn key={status} title={status} tasks={tasksByStatus(status)} users={users} currentUser={currentUser} teams={teams} />
            ))}
        </div>
        <ScrollBar orientation="horizontal" />
        </ScrollArea>
    </DndContext>
  );
};

export default TaskColumns;
