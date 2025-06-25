
'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from '@/components/chorey/task-card';
import type { Task, User, Team } from '@/lib/types';

type SortableTaskCardProps = {
    task: Task;
    users: User[];
    currentUser: User | null;
    teams: Team[];
}

export function SortableTaskCard({ task, users, currentUser, teams }: SortableTaskCardProps) {
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
            <TaskCard task={task} users={users} isDragging={isDragging} currentUser={currentUser} teams={teams} />
        </div>
    );
}
