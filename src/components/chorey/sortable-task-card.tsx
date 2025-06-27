
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
}

export function SortableTaskCard({ task, users, currentUser, projects }: SortableTaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard task={task} users={users} isDragging={isDragging} currentUser={currentUser} projects={projects} />
        </div>
    );
}

    