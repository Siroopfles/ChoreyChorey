
'use server';

import { db } from '@/lib/core/firebase';
import { addDoc, collection, writeBatch } from 'firebase/firestore';
import type { GoalToProjectOutput } from '@/ai/schemas';
import type { Task, Status } from '@/lib/types';
import { addHistoryEntry } from '@/lib/utils/history-utils';

export async function createProjectFromAi(
  organizationId: string,
  creatorId: string,
  projectData: GoalToProjectOutput
): Promise<{ data: { projectId: string } | null; error: string | null }> {
  try {
    // 1. Create the project
    const projectRef = await addDoc(collection(db, 'projects'), {
      name: projectData.projectName,
      organizationId,
      createdAt: new Date(),
    });

    // 2. Create all the tasks in a batch
    const batch = writeBatch(db);
    for (const task of projectData.tasks) {
      const taskRef = doc(collection(db, 'tasks'));
      const firestoreTask: Omit<Task, 'id'> = {
        title: task.title,
        description: task.description,
        status: 'Te Doen' as Status,
        priority: task.priority,
        storyPoints: task.storyPoints,
        projectId: projectRef.id,
        organizationId,
        creatorId,
        createdAt: new Date(),
        order: Date.now(),
        labels: [],
        assigneeIds: [],
        subtasks: [],
        attachments: [],
        comments: [],
        history: [addHistoryEntry(creatorId, 'Aangemaakt via AI Goal-to-Project')],
        isPrivate: false,
      };
      batch.set(taskRef, firestoreTask);
    }
    await batch.commit();
    
    return { data: { projectId: projectRef.id }, error: null };
  } catch (error: any) {
    console.error("Error creating project from AI:", error);
    return { data: null, error: "Kon het project en de taken niet aanmaken." };
  }
}
