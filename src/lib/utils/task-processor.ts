
'use client';

import { Timestamp } from 'firebase/firestore';
import type { Task, User, Project } from '@/lib/types';

export const processTaskDoc = (doc: any, projects: Project[], canViewSensitive: boolean, user: User): Task => {
    const data = doc.data();
    const task: Task = {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        dueDate: (data.dueDate as Timestamp)?.toDate(),
        completedAt: (data.completedAt as Timestamp)?.toDate(),
        activeTimerStartedAt: data.activeTimerStartedAt ? Object.fromEntries(
          Object.entries(data.activeTimerStartedAt).map(([key, value]) => [key, (value as Timestamp).toDate()])
        ) : null,
        history: (data.history || []).map((h: any) => ({ ...h, timestamp: (h.timestamp as Timestamp)?.toDate() })),
        comments: (data.comments || []).map((c: any) => ({ ...c, createdAt: (c.createdAt as Timestamp)?.toDate(), readBy: c.readBy || [] })),
        typing: data.typing ? Object.fromEntries(
          Object.entries(data.typing).map(([key, value]) => [key, (value as Timestamp).toDate()])
        ) : undefined,
    };
    
    // Mask sensitive data
    const projectIsSensitive = task.projectId ? projects.find(p => p.id === task.projectId)?.isSensitive : false;
    if ((task.isSensitive || projectIsSensitive) && !canViewSensitive) {
        return { ...task, title: '[Gevoelige Taak]', description: 'U heeft geen permissie om de details van deze taak te zien.', subtasks: task.subtasks.map(st => ({...st, text: '[Verborgen]'})) };
    }
    
    // Filter private subtasks
    if(task.subtasks) {
      task.subtasks = task.subtasks.filter(st => !st.isPrivate || task.assigneeIds.includes(user.id) || task.creatorId === user.id);
    }
    
    return task;
}
