'use client';
import type { User, Status, Task } from '@/lib/types';
import { useTasks } from '@/contexts/task-context';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, rectIntersection } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { SortableTaskCard } from '@/components/chorey/sortable-task-card';

const TaskColumn = ({ title, tasks, users }: { title: Status; tasks: Task[]; users: User[] }) => {
  return (
    <div className="flex flex-col w-[320px] shrink-0">
      <div className="flex items-center gap-2 px-1 pb-2">
        <h2 className="text-base font-semibold font-headline text-foreground">{title}</h2>
        <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
       <SortableContext id={title} items={tasks.map(t => t.id)}>
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
  const { tasks, searchTerm, updateTask } = useTasks();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require pointer to move 8px before dragging starts
      },
    })
  );

  const columns: Status[] = ["Te Doen", "In Uitvoering", "Voltooid", "Geannuleerd", "Gearchiveerd"];

  const tasksByStatus = (status: Status) => {
    const filteredTasks = tasks.filter((task) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          task.title.toLowerCase().includes(term) ||
          (task.description && task.description.toLowerCase().includes(term))
        );
      });

    return filteredTasks
        .filter((task) => task.status === status)
        .sort((a,b) => (a.dueDate?.getTime() || Infinity) - (b.dueDate?.getTime() || Infinity));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;
    
    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable.containerId || over.id;

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      // Logic for reordering within the same column could be added here
      // but is skipped for now as it requires an `order` field on tasks.
      return;
    }

    // Task is dropped in a different column, update its status
    updateTask(active.id as string, { status: overContainer as Status });
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
            <TaskColumn key={status} title={status} tasks={tasksByStatus(status)} users={users} />
            ))}
        </div>
        <ScrollBar orientation="horizontal" />
        </ScrollArea>
    </DndContext>
  );
};

export default TaskColumns;
