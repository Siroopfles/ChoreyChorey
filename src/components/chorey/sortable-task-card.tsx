

'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from '@/components/chorey/task-card';
import type { Task, User, Project } from '@/lib/types';

type SortableTaskCardProps = {
    task: Task;
    users: User[];
    currentUser: User | null;
    projects: Project[];
    isOverdue: boolean;
    isDueToday: boolean;
    isDueSoon: boolean;
    blockingTasks: Task[];
    relatedTasks: { taskId: string; type: "related_to" | "duplicate_of"; title?: string }[];
    blockedByTasks: Task[];
}

export function SortableTaskCard({ task, users, currentUser, projects, blockingTasks, relatedTasks, blockedByTasks, isOverdue, isDueToday, isDueSoon }: SortableTaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { isBlocked: task.isBlocked } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard 
              task={task} 
              users={users} 
              isDragging={isDragging} 
              currentUser={currentUser} 
              projects={projects} 
              isBlocked={task.isBlocked || false} 
              blockingTasks={blockingTasks} 
              relatedTasks={relatedTasks}
              blockedByTasks={blockedByTasks}
              isOverdue={isOverdue}
              isDueToday={isDueToday}
              isDueSoon={isDueSoon}
            />
        </div>
    );
}
