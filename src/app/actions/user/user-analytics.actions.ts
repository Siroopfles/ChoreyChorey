'use server';

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/core/firebase';
import type { Task } from '@/lib/types';
import { getDay, getHours } from 'date-fns';

type UserAnalyticsData = {
  totalTasksCompleted: number;
  totalTimeLogged: number;
  tasksByDay: number[]; // Array of 7, index 0 is Sunday
  tasksByHour: number[]; // Array of 24, index 0 is 00:00 - 01:00
};

export async function getUserAnalytics(
  userId: string,
  organizationId: string
): Promise<{ data: UserAnalyticsData | null; error: string | null }> {
  try {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('organizationId', '==', organizationId),
      where('assigneeIds', 'array-contains', userId),
      where('status', '==', 'Voltooid')
    );

    const snapshot = await getDocs(tasksQuery);
    const completedTasks = snapshot.docs.map(doc => {
      const data = doc.data();
      return { ...data, completedAt: (data.completedAt as Timestamp)?.toDate() } as Task;
    });

    const totalTasksCompleted = completedTasks.length;
    const totalTimeLogged = completedTasks.reduce((sum, task) => sum + (task.timeLogged || 0), 0);

    const tasksByDay = Array(7).fill(0);
    const tasksByHour = Array(24).fill(0);

    completedTasks.forEach(task => {
      if (task.completedAt) {
        const dayOfWeek = getDay(task.completedAt); // Sunday = 0
        const hourOfDay = getHours(task.completedAt);
        tasksByDay[dayOfWeek]++;
        tasksByHour[hourOfDay]++;
      }
    });

    return {
      data: {
        totalTasksCompleted,
        totalTimeLogged,
        tasksByDay,
        tasksByHour,
      },
      error: null,
    };
  } catch (e: any) {
    console.error("Error fetching user analytics data:", e);
    return { data: null, error: e.message };
  }
}
