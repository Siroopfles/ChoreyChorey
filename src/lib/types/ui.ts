import { z } from 'zod';
import type { Priority } from './tasks';

export type Filters = {
  assigneeId: string | null;
  labels: string[];
  priority: Priority | null;
  projectId: string | null;
  teamId: string | null;
};

export type SavedFilter = {
  id: string;
  name: string;
  creatorId: string;
  filters: Filters;
};

export const statusStyles: Record<string, { dot: string; label: string }> = {
  Online: { dot: 'bg-green-500', label: 'Online' },
  Afwezig: { dot: 'bg-yellow-500', label: 'Afwezig' },
  'In vergadering': { dot: 'bg-red-500', label: 'In vergadering' },
  'Niet storen': { dot: 'bg-purple-500', label: 'Niet storen' },
  Offline: { dot: 'bg-gray-400', label: 'Offline' },
};

// --- Dashboard Widget Types ---
export const WIDGET_TYPES = {
  tasksByStatus: 'Taken per Status',
  tasksByPriority: 'Taken per Prioriteit',
  leaderboard: 'Scorebord',
  activityFeed: 'Recente Activiteit (Organisatie)',
  recentActivity: 'Mijn Recente Activiteit',
  myTasks: 'Mijn Openstaande Taken',
  welcome: 'Welkomstbericht',
} as const;

export type WidgetType = keyof typeof WIDGET_TYPES;

export const ChartWidgetConfigSchema = z.object({
  chartType: z.enum(['pie', 'bar']).default('pie'),
});
export type ChartWidgetConfig = z.infer<typeof ChartWidgetConfigSchema>;

export const LeaderboardWidgetConfigSchema = z.object({
  limit: z.number().default(5),
});
export type LeaderboardWidgetConfig = z.infer<typeof LeaderboardWidgetConfigSchema>;

export const MyTasksWidgetConfigSchema = z.object({
  limit: z.number().default(5),
});
export type MyTasksWidgetConfig = z.infer<typeof MyTasksWidgetConfigSchema>;

export const NoConfigSchema = z.object({});

export const widgetInstanceSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("tasksByStatus"),
    config: ChartWidgetConfigSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("tasksByPriority"),
    config: ChartWidgetConfigSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("leaderboard"),
    config: LeaderboardWidgetConfigSchema,
  }),
   z.object({
    id: z.string(),
    type: z.literal("myTasks"),
    config: MyTasksWidgetConfigSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("activityFeed"),
    config: NoConfigSchema,
  }),
   z.object({
    id: z.string(),
    type: z.literal("recentActivity"),
    config: NoConfigSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("welcome"),
    config: NoConfigSchema,
  }),
]);

export type WidgetInstance = z.infer<typeof widgetInstanceSchema>;
