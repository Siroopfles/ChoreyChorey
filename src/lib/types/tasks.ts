
import { z } from 'zod';
import type { GitHubLink, GitLabLink, BitbucketLink, JiraLink } from './integrations';

export type Priority = string;
export type Status = string;
export type Label = string;
export const ALL_SKILLS: string[] = ["Koken", "Schoonmaken", "Tuinieren", "Techniek", "Administratie", "Organiseren", "Boodschappen", "Dierenverzorging", "Planning", "Communicatie"];

export const monthlyRecurringSchema = z.object({
  type: z.literal('day_of_month'),
  day: z.number().min(1).max(31),
}).or(z.object({
  type: z.literal('day_of_week'),
  week: z.enum(['first', 'second', 'third', 'fourth', 'last']),
  weekday: z.number().min(0).max(6),
}));

export const recurringSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  monthly: monthlyRecurringSchema.optional(),
}).refine(data => {
  // If frequency is monthly, the monthly details must be provided.
  return data.frequency !== 'monthly' || !!data.monthly;
}, {
  message: "Maandelijkse herhalingsdetails zijn vereist wanneer de frequentie is ingesteld op maandelijks.",
  path: ["monthly"],
});

export type Recurring = z.infer<typeof recurringSchema>;

export type Subtask = {
  id: string;
  text: string;
  completed: boolean;
  isPrivate?: boolean;
};

export type Attachment = {
  id:string;
  name: string;
  url: string;
  type: "image" | "file";
};

export type Comment = {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
  readBy?: string[];
  reactions?: Record<string, string[]>;
  parentId?: string | null;
};

export type HistoryEntry = {
    id: string;
    userId: string;
    timestamp: Date;
    action: string;
    details?: string;
}

export const taskRelationTypeSchema = z.enum(['related_to', 'duplicate_of']);
export type TaskRelationType = z.infer<typeof taskRelationTypeSchema>;

export const taskRelationSchema = z.object({
  taskId: z.string(),
  type: taskRelationTypeSchema,
});
export type TaskRelation = z.infer<typeof taskRelationSchema>;

export const pollOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Optie mag niet leeg zijn."),
  voterIds: z.array(z.string()),
});

export const pollSchema = z.object({
  question: z.string().min(3, "Poll-vraag moet minimaal 3 karakters bevatten."),
  options: z.array(pollOptionSchema).min(2, "Een poll moet minimaal 2 opties hebben."),
  isMultiVote: z.boolean().default(false),
});

export type Poll = z.infer<typeof pollSchema>;
export type PollOption = z.infer<typeof pollOptionSchema>;

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  dueDate?: Date;
  assigneeIds: string[];
  creatorId: string | null;
  projectId?: string | null;
  teamId?: string | null;
  labels: Label[];
  subtasks: Subtask[];
  attachments: Attachment[];
  comments: Comment[];
  history: HistoryEntry[];
  isPrivate: boolean;
  isSensitive?: boolean;
  isBlocked?: boolean;
  createdAt: Date;
  completedAt?: Date;
  order: number;
  storyPoints?: number | null;
  cost?: number | null;
  blockedBy?: string[];
  relations?: TaskRelation[];
  dependencyConfig?: { [taskId: string]: { lag: number; unit: 'days' | 'hours' } };
  recurring?: Recurring | null;
  organizationId: string;
  typing?: { [key: string]: Date };
  imageUrl?: string | null;
  thanked?: boolean;
  timeLogged?: number; // in seconds
  activeTimerStartedAt?: Record<string, Date> | null;
  rating?: number | null;
  reviewerId?: string | null;
  consultedUserIds?: string[];
  informedUserIds?: string[];
  isChoreOfTheWeek?: boolean;
  helpNeeded?: boolean;
  googleEventId?: string | null;
  microsoftEventId?: string | null;
  githubLinks?: GitHubLink[];
  githubLinkUrls?: string[];
  gitlabLinks?: GitLabLink[];
  bitbucketLinks?: BitbucketLink[];
  jiraLinks?: JiraLink[];
  jiraLinkKeys?: string[];
  togglWorkspaceId?: number;
  togglProjectId?: number;
  clockifyWorkspaceId?: string;
  clockifyProjectId?: string;
  customFieldValues?: Record<string, any>;
  pinned?: boolean;
  callSession?: {
    isActive: boolean;
    participants: Record<string, { name: string; avatar: string; isMuted: boolean }>;
  };
  poll?: Poll | null;
  whiteboard?: string;
};

export const githubLinkSchema = z.object({
  url: z.string().url(),
  number: z.number(),
  title: z.string(),
  state: z.enum(['open', 'closed', 'merged']),
  type: z.enum(['issue', 'pull-request', 'commit']),
});

export const gitlabLinkSchema = z.object({
  url: z.string().url(),
  iid: z.number(),
  title: z.string(),
  state: z.enum(['opened', 'closed', 'locked', 'merged']),
  type: z.enum(['issue', 'merge_request']),
});

export const bitbucketLinkSchema = z.object({
  url: z.string().url(),
  id: z.string(),
  title: z.string(),
  state: z.string(),
  type: z.literal('issue'),
});

export const jiraLinkSchema = z.object({
  url: z.string().url(),
  key: z.string(),
  summary: z.string(),
  status: z.string(),
  iconUrl: z.string().url(),
});

export const subtaskSchema = z.object({
    text: z.string().min(1, 'Subtaak mag niet leeg zijn.'),
    isPrivate: z.boolean().optional(),
});

export const taskFormSchema = z.object({
  title: z.string().min(3, 'Titel moet minimaal 3 karakters lang zijn.'),
  description: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  projectId: z.string().optional(),
  teamId: z.string().optional(),
  dueDate: z.date().optional().nullable(),
  priority: z.string().min(1, 'Prioriteit is verplicht.'),
  labels: z.array(z.string()).optional(),
  subtasks: z.array(subtaskSchema).optional(),
  attachments: z.array(z.object({ 
      name: z.string().min(1, 'Naam mag niet leeg zijn.'),
      url: z.string().url('Voer een geldige URL in.'),
    })).optional(),
  isPrivate: z.boolean().default(false),
  isSensitive: z.boolean().default(false),
  isBlocked: z.boolean().optional(),
  helpNeeded: z.boolean().default(false),
  storyPoints: z.coerce.number().optional().nullable(),
  cost: z.coerce.number().optional().nullable(),
  blockedBy: z.array(z.string().min(1, 'ID mag niet leeg zijn.')).optional(),
  relations: z.array(taskRelationSchema).optional(),
  dependencyConfig: z.record(z.string(), z.object({ lag: z.coerce.number(), unit: z.enum(['days', 'hours']) })).optional(),
  recurring: recurringSchema.optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  reviewerId: z.string().optional().nullable(),
  consultedUserIds: z.array(z.string()).optional(),
  informedUserIds: z.array(z.string()).optional(),
  githubLinks: z.array(githubLinkSchema).optional(),
  githubLinkUrls: z.array(z.string().url()).optional(),
  gitlabLinks: z.array(gitlabLinkSchema).optional(),
  bitbucketLinks: z.array(bitbucketLinkSchema).optional(),
  jiraLinks: z.array(jiraLinkSchema).optional(),
  jiraLinkKeys: z.array(z.string()).optional(),
  togglWorkspaceId: z.coerce.number().optional().nullable(),
  togglProjectId: z.coerce.number().optional().nullable(),
  clockifyWorkspaceId: z.string().optional().nullable(),
  clockifyProjectId: z.string().optional().nullable(),
  customFieldValues: z.record(z.any()).optional(),
  pinned: z.boolean().optional(),
  callSession: z.any().optional(),
  poll: pollSchema.optional().nullable(),
  whiteboard: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
