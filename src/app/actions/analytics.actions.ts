'use server';

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, HistoryEntry } from '@/lib/types';
import { differenceInDays } from 'date-fns';

type TimePoint = {
  name: string; // Task title
  value: number; // Duration in days
};

export type CycleTimeData = {
  cycleTime: TimePoint[];
  leadTime: TimePoint[];
  bottlenecks: string[];
};

type GetCycleTimeDataInput = {
  organizationId: string;
  startDate: string;
  endDate: string;
};

function findFirstOccurrence(history: HistoryEntry[], action: string): Date | null {
  const entry = history.find(h => h.action === action);
  return entry ? entry.timestamp : null;
}

export async function getCycleTimeData(input: GetCycleTimeDataInput): Promise<{ data: CycleTimeData | null; error: string | null; }> {
  const { organizationId, startDate, endDate } = input;

  try {
    const q = query(
      collection(db, 'tasks'),
      where('organizationId', '==', organizationId),
      where('status', '==', 'Voltooid'),
      where('completedAt', '>=', Timestamp.fromDate(new Date(startDate))),
      where('completedAt', '<=', Timestamp.fromDate(new Date(endDate)))
    );

    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    
    if (tasks.length === 0) {
        return { data: { cycleTime: [], leadTime: [], bottlenecks: [] }, error: null };
    }

    const cycleTimeData: TimePoint[] = [];
    const leadTimeData: TimePoint[] = [];
    const statusDurations: Record<string, number[]> = {};

    tasks.forEach(task => {
      const history = (task.history || []).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Lead Time
      const createdAt = task.createdAt;
      const completedAt = task.completedAt;
      if (createdAt && completedAt) {
        leadTimeData.push({
          name: task.title,
          value: differenceInDays(completedAt, createdAt),
        });
      }
      
      // Cycle Time
      const inProgressAt = findFirstOccurrence(history, "Status gewijzigd van Te Doen naar In Uitvoering");
      if (inProgressAt && completedAt) {
        cycleTimeData.push({
          name: task.title,
          value: differenceInDays(completedAt, inProgressAt),
        });
      }
      
      // Bottleneck analysis
      let lastTimestamp = createdAt;
      let lastStatus = 'Te Doen';
      history.forEach(entry => {
        if (entry.action.startsWith('Status gewijzigd van')) {
            if (!statusDurations[lastStatus]) {
                statusDurations[lastStatus] = [];
            }
            statusDurations[lastStatus].push(differenceInDays(entry.timestamp, lastTimestamp));
            
            lastStatus = entry.details?.split('naar "')[1]?.replace('"', '') || lastStatus;
            lastTimestamp = entry.timestamp;
        }
      });
    });
    
    const bottlenecks: string[] = [];
    const avgDurations = Object.entries(statusDurations).map(([status, durations]) => ({
      status,
      avg: durations.reduce((a,b) => a+b, 0) / durations.length,
    })).sort((a,b) => b.avg - a.avg);

    if (avgDurations.length > 1 && avgDurations[0].avg > avgDurations[1].avg * 1.5) {
        bottlenecks.push(`Taken brengen gemiddeld de meeste tijd door in de status '${avgDurations[0].status}' (${avgDurations[0].avg.toFixed(1)} dagen), wat kan duiden op een knelpunt.`);
    }

    return { data: { cycleTime: cycleTimeData, leadTime: leadTimeData, bottlenecks }, error: null };

  } catch (e: any) {
    console.error("Error fetching cycle time data:", e);
    return { data: null, error: e.message };
  }
}
