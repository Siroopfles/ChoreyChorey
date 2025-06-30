
'use server';

import { collection, query, where, getDocs, Timestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, HistoryEntry, Project, User, StatusDefinition } from '@/lib/types';
import { differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval, format, formatISO, isAfter, endOfDay } from 'date-fns';

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

export type VelocityDataPoint = {
  period: string;
  velocity: number;
};

export type GetTeamVelocityDataInput = {
  organizationId: string;
  teamId: string;
  startDate: string;
  endDate: string;
};

export type CostAnalysisData = {
    totalBudget: number;
    totalCost: number;
    remainingBudget: number;
    budgetProgress: number;
    costByMember: { name: string; cost: number; taskCount: number }[];
    costByTask: { id: string; title: string; cost: number }[];
};

type GetCostAnalysisDataInput = {
  organizationId: string;
  projectId: string;
};

export type CfdDataPoint = {
  date: string;
  [status: string]: number | string;
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

export async function getTeamVelocityData(
  input: GetTeamVelocityDataInput
): Promise<{ data: VelocityDataPoint[] | null; error: string | null }> {
  const { organizationId, teamId, startDate, endDate } = input;

  try {
    const teamDoc = await getDoc(doc(db, 'teams', teamId));
    if (!teamDoc.exists() || teamDoc.data().organizationId !== organizationId) {
      return { data: null, error: 'Team niet gevonden.' };
    }
    const teamMemberIds = teamDoc.data().memberIds || [];
    if (teamMemberIds.length === 0) {
      return { data: [], error: null };
    }

    const q = query(
      collection(db, 'tasks'),
      where('organizationId', '==', organizationId),
      where('assigneeIds', 'array-contains-any', teamMemberIds),
      where('status', '==', 'Voltooid'),
      where('completedAt', '>=', Timestamp.fromDate(new Date(startDate))),
      where('completedAt', '<=', Timestamp.fromDate(new Date(endDate)))
    );

    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => ({ ...doc.data(), completedAt: (doc.data().completedAt as Timestamp)?.toDate() } as Task));

    const weeks = eachWeekOfInterval(
      { start: new Date(startDate), end: new Date(endDate) },
      { weekStartsOn: 1 } // Monday
    );

    const velocityByWeek: Record<string, number> = {};

    weeks.forEach(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekLabel = `${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM')}`;
      velocityByWeek[weekLabel] = 0;
    });

    tasks.forEach(task => {
        if (task.completedAt && task.storyPoints) {
            const weekStart = startOfWeek(task.completedAt, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            const weekLabel = `${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM')}`;

            if (velocityByWeek.hasOwnProperty(weekLabel)) {
                velocityByWeek[weekLabel] += task.storyPoints;
            }
      }
    });

    const data: VelocityDataPoint[] = Object.entries(velocityByWeek).map(([period, velocity]) => ({
      period,
      velocity,
    }));

    return { data, error: null };

  } catch (e: any) {
    console.error("Error fetching team velocity data:", e);
    return { data: null, error: e.message };
  }
}


export async function getCostAnalysisData(input: GetCostAnalysisDataInput): Promise<{ data: CostAnalysisData | null; error: string | null; }> {
  const { organizationId, projectId } = input;

  try {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists() || projectDoc.data().organizationId !== organizationId) {
        return { data: null, error: 'Project niet gevonden of behoort niet tot deze organisatie.' };
    }
    const project = projectDoc.data() as Project;
    const totalBudget = project.budget || 0;

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('organizationId', '==', organizationId),
      where('projectId', '==', projectId)
    );
    
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

    const totalCost = tasks.reduce((sum, task) => sum + (task.cost || 0), 0);

    const costByTask = tasks
      .filter(task => task.cost && task.cost > 0)
      .map(task => ({ id: task.id, title: task.title, cost: task.cost! }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10); // Top 10 most expensive tasks

    const memberCosts: Record<string, { cost: number; taskCount: number }> = {};
    const userIds = new Set<string>();
    tasks.forEach(task => {
        if (task.cost && task.cost > 0 && task.assigneeIds.length > 0) {
            task.assigneeIds.forEach(id => userIds.add(id));
            const costPerAssignee = task.cost / task.assigneeIds.length; // Evenly split cost
            task.assigneeIds.forEach(assigneeId => {
                if (!memberCosts[assigneeId]) {
                    memberCosts[assigneeId] = { cost: 0, taskCount: 0 };
                }
                memberCosts[assigneeId].cost += costPerAssignee;
                memberCosts[assigneeId].taskCount++;
            });
        }
    });
    
    let costByMember: { name: string; cost: number; taskCount: number }[] = [];
    if (userIds.size > 0) {
        const usersQuery = query(collection(db, 'users'), where('__name__', 'in', Array.from(userIds)));
        const usersSnapshot = await getDocs(usersQuery);
        const userMap = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data() as User]));

        costByMember = Object.entries(memberCosts)
            .map(([userId, data]) => ({
                name: userMap.get(userId)?.name || 'Onbekende gebruiker',
                cost: data.cost,
                taskCount: data.taskCount
            }))
            .sort((a,b) => b.cost - a.cost);
    }
    
    return { 
        data: {
            totalBudget,
            totalCost,
            remainingBudget: totalBudget - totalCost,
            budgetProgress: totalBudget > 0 ? (totalCost / totalBudget) * 100 : 0,
            costByMember,
            costByTask
        }, 
        error: null 
    };

  } catch (e: any) {
    console.error("Error fetching cost analysis data:", e);
    return { data: null, error: e.message };
  }
}

export async function getCfdData(input: {
  organizationId: string;
  startDate: string;
  endDate: string;
}): Promise<{ data: CfdDataPoint[] | null; statuses: string[] | null; error: string | null; }> {
  const { organizationId, startDate, endDate } = input;

  try {
    const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
    if (!orgDoc.exists()) {
      return { data: null, statuses: null, error: 'Organisatie niet gevonden.' };
    }
    const statuses = (orgDoc.data().settings?.customization?.statuses || []).map((s: StatusDefinition) => s.name);

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('organizationId', '==', organizationId),
      where('createdAt', '<=', Timestamp.fromDate(new Date(endDate)))
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: (doc.data().createdAt as Timestamp).toDate() } as Task));

    const dateRange = eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) });
    
    const cfdData = dateRange.map(day => {
      const dayStr = formatISO(day, { representation: 'date' });
      const counts: CfdDataPoint = { date: dayStr };
      
      statuses.forEach((status: string) => {
        counts[status] = 0;
      });

      tasks.forEach(task => {
        // Task did not exist yet on this day
        if (isAfter(task.createdAt, endOfDay(day))) {
          return;
        }

        let statusOnDay: string = 'Te Doen';
        
        const history = (task.history || [])
            .map(h => ({ ...h, timestamp: (h.timestamp as Timestamp).toDate() }))
            .filter(h => h.action.startsWith('Status gewijzigd') && !isAfter(h.timestamp, endOfDay(day)))
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            
        if (history.length > 0) {
            const lastStatusChange = history[history.length - 1];
            const match = lastStatusChange.details?.match(/naar "(.*?)"/);
            if(match && match[1]) {
                statusOnDay = match[1];
            }
        }
        
        // Only count if status exists in org's statuses.
        if (counts[statusOnDay] !== undefined) {
            (counts[statusOnDay] as number)++;
        }
      });
      return counts;
    });

    return { data: cfdData, statuses, error: null };
  } catch (e: any) {
    console.error("Error fetching CFD data:", e);
    return { data: null, statuses: null, error: e.message };
  }
}
