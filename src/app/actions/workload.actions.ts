'use server';

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, Priority, User } from '@/lib/types';
import { eachDayOfInterval, formatISO, startOfDay, isAfter } from 'date-fns';

// These schemas are for documentation and can be used with Zod on the client if needed.
type GetWorkloadDataInput = {
  organizationId: string;
  startDate: string;
  endDate: string;
};

type UserWorkload = {
  name: string;
  points: number;
  taskCount: number;
};

type DailyWorkload = {
  date: string;
  totalPoints: number;
  users: Record<string, UserWorkload>;
  unavailableUserIds: string[];
};

export type GetWorkloadDataOutput = DailyWorkload[];

function priorityToPoints(priority: Priority): number {
    switch (priority) {
        case 'Urgent': return 8;
        case 'Hoog': return 5;
        case 'Midden': return 3;
        case 'Laag': return 1;
        default: return 3;
    }
}

export async function getWorkloadData(input: GetWorkloadDataInput): Promise<GetWorkloadDataOutput> {
  const { organizationId, startDate, endDate } = input;
  
  try {
    const usersQuery = query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId));
    const usersSnapshot = await getDocs(usersQuery);
    const userMap = new Map(usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return [doc.id, { 
          id: doc.id, 
          ...data,
          status: {
              ...data.status,
              until: (data.status?.until as Timestamp)?.toDate()
          }
      } as User]
    }));

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('organizationId', '==', organizationId),
      where('dueDate', '>=', Timestamp.fromDate(new Date(startDate))),
      where('dueDate', '<=', Timestamp.fromDate(new Date(endDate)))
    );
    
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs
      .map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              ...data,
              dueDate: (data.dueDate as Timestamp)?.toDate(),
          } as Task
      })
      .filter(task => task.status !== 'Voltooid' && task.status !== 'Geannuleerd' && task.status !== 'Gearchiveerd');

    const interval = eachDayOfInterval({
        start: new Date(startDate),
        end: new Date(endDate),
    });
    
    const workloadByDay: Record<string, DailyWorkload> = {};

    interval.forEach(day => {
        const dateKey = formatISO(day, { representation: 'date' });
        const unavailableUserIds: string[] = [];
        userMap.forEach(user => {
            const status = user.status?.type;
            const until = user.status?.until;
            
            if (status === 'Afwezig' || (status === 'Niet storen' && until && isAfter(until, day))) {
                unavailableUserIds.push(user.id);
            }
        });

        workloadByDay[dateKey] = {
            date: dateKey,
            totalPoints: 0,
            users: {},
            unavailableUserIds,
        };
    });

    tasks.forEach(task => {
      if (!task.dueDate) return;
      const dateKey = formatISO(startOfDay(task.dueDate), { representation: 'date' });

      if (workloadByDay[dateKey] && task.assigneeIds.length > 0) {
        const points = task.storyPoints || priorityToPoints(task.priority);
        
        task.assigneeIds.forEach(userId => {
          const user = userMap.get(userId);
          if (user && !workloadByDay[dateKey].unavailableUserIds.includes(userId)) {
            if (!workloadByDay[dateKey].users[userId]) {
              workloadByDay[dateKey].users[userId] = { name: user.name, points: 0, taskCount: 0 };
            }
            workloadByDay[dateKey].users[userId].points += points;
            workloadByDay[dateKey].users[userId].taskCount += 1;
            workloadByDay[dateKey].totalPoints += points;
          }
        });
      }
    });

    return Object.values(workloadByDay);
  } catch(e) {
      console.error("Error fetching workload data:", e);
      return [];
  }
}