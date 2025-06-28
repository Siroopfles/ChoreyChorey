

import { z } from 'zod';
import type { Layout } from 'react-grid-layout';

export const customFieldDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['text', 'number', 'date', 'select']),
  options: z.array(z.string()).optional(), // Only for 'select' type
});

export type CustomFieldDefinition = z.infer<typeof customFieldDefinitionSchema>;


export type GitHubLink = {
  url: string;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  type: 'issue' | 'pull-request' | 'commit';
};

export type GitLabLink = {
  url: string;
  iid: number; // Internal ID for issues/MRs in GitLab
  title: string;
  state: 'opened' | 'closed' | 'locked' | 'merged';
  type: 'issue' | 'merge_request';
};

export type BitbucketLink = {
  url: string;
  id: string; // Issue ID in Bitbucket
  title: string;
  state: string; // e.g., 'new', 'open', 'resolved'
  type: 'issue';
};

export type JiraLink = {
  url: string;
  key: string;
  summary: string;
  status: string;
  iconUrl: string;
};

export type OrganizationSettings = {
  customization: {
    statuses: string[];
    labels: string[];
    priorities: string[];
    customRoles?: Record<string, { name: string; permissions: Permission[] }>;
    customFields?: CustomFieldDefinition[];
  },
  features?: {
    gamification: boolean;
    storyPoints: boolean;
    timeTracking: boolean;
    mentorship?: boolean;
    goals?: boolean;
    ideas?: boolean;
    raci?: boolean;
    publicSharing?: boolean;
    toggl?: boolean;
    clockify?: boolean;
    jira?: boolean;
    gitlab?: boolean;
    bitbucket?: boolean;
  },
  branding?: {
    primaryColor?: string;
    logoUrl?: string;
  },
  announcement?: {
    id: string;
    message: string;
    level: 'info' | 'warning' | 'emergency';
  } | null;
  savedFilters?: SavedFilter[];
  slack?: {
    enabled: boolean;
    channelId: string;
  };
  github?: {
    owner: string;
    repos: string[];
  };
  gitlab?: {
    projects: string[];
  };
   bitbucket?: {
    workspace: string;
    repos: string[];
  };
  teams?: {
    enabled: boolean;
    webhookUrl: string;
  };
  discord?: {
    enabled: boolean;
    webhookUrl: string;
  };
  limits?: {
    maxMembers?: number;
    maxTasks?: number;
    maxProjects?: number;
  },
  sessionPolicy?: {
    idleTimeoutSeconds?: number;
    absoluteTimeoutSeconds?: number;
  },
  guestAccess?: {
    [userId: string]: {
        projectIds: string[];
    }
  }
}

export type Organization = {
  id: string;
  name: string;
  ownerId: string;
  members: Record<string, OrganizationMember>; // Map of userId to their role info
  settings?: OrganizationSettings;
};

export type OrganizationMember = {
  role: RoleName;
};

export const PERMISSIONS = {
  MANAGE_ORGANIZATION: 'MANAGE_ORGANIZATION',
  MANAGE_ROLES: 'MANAGE_ROLES',
  MANAGE_MEMBERS: 'MANAGE_MEMBERS',
  MANAGE_PROJECTS: 'MANAGE_PROJECTS',
  MANAGE_TEAMS: 'MANAGE_TEAMS',
  CREATE_TASK: 'CREATE_TASK',
  EDIT_TASK: 'EDIT_TASK',
  DELETE_TASK: 'DELETE_TASK',
  ASSIGN_TASK: 'ASSIGN_TASK',
  VIEW_ALL_TASKS: 'VIEW_ALL_TASKS',
  VIEW_AUDIT_LOG: 'VIEW_AUDIT_LOG',
  VIEW_SENSITIVE_DATA: 'VIEW_SENSITIVE_DATA',
  MANAGE_IDEAS: 'MANAGE_IDEAS',
  MANAGE_API_KEYS: 'MANAGE_API_KEYS',
  MANAGE_INTEGRATIONS: 'MANAGE_INTEGRATIONS',
  MANAGE_TEMPLATES: 'MANAGE_TEMPLATES',
  MANAGE_TIME_TRACKING_INTEGRATIONS: 'MANAGE_TIME_TRACKING_INTEGRATIONS',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const PERMISSIONS_DESCRIPTIONS: Record<Permission, { name: string, description: string }> = {
  [PERMISSIONS.MANAGE_ORGANIZATION]: { name: 'Organisatie Beheren', description: 'Kan de naam, workflow en feature instellingen van de organisatie aanpassen.' },
  [PERMISSIONS.MANAGE_ROLES]: { name: 'Rollen Beheren', description: 'Kan de rollen van andere leden aanpassen (behalve de eigenaar).' },
  [PERMISSIONS.MANAGE_MEMBERS]: { name: 'Leden Beheren', description: 'Kan leden uitnodigen voor en verwijderen uit de organisatie.' },
  [PERMISSIONS.MANAGE_PROJECTS]: { name: 'Projecten Beheren', description: 'Kan projecten aanmaken, bewerken en verwijderen.' },
  [PERMISSIONS.MANAGE_TEAMS]: { name: 'Teams Beheren', description: 'Kan teams aanmaken en de leden van teams beheren.' },
  [PERMISSIONS.CREATE_TASK]: { name: 'Taken Aanmaken', description: 'Kan nieuwe taken aanmaken binnen de organisatie.' },
  [PERMISSIONS.EDIT_TASK]: { name: 'Taken Bewerken', description: 'Kan de details van bestaande taken aanpassen.' },
  [PERMISSIONS.DELETE_TASK]: { name: 'Taken Verwijderen', description: 'Kan taken annuleren of permanent verwijderen.' },
  [PERMISSIONS.ASSIGN_TASK]: { name: 'Taken Toewijzen', description: 'Kan taken toewijzen aan leden van de organisatie.' },
  [PERMISSIONS.VIEW_ALL_TASKS]: { name: 'Alle Taken Zien', description: 'Kan alle niet-privé taken binnen de organisatie bekijken.' },
  [PERMISSIONS.VIEW_AUDIT_LOG]: { name: 'Audit Log Bekijken', description: 'Heeft toegang tot de audit log met alle acties binnen de organisatie.' },
  [PERMISSIONS.VIEW_SENSITIVE_DATA]: { name: 'Gevoelige Data Zien', description: 'Kan de inhoud van taken zien die als "gevoelig" zijn gemarkeerd.' },
  [PERMISSIONS.MANAGE_IDEAS]: { name: 'Ideeën Beheren', description: 'Kan de status van ideeën in de ideeënbus aanpassen.' },
  [PERMISSIONS.MANAGE_API_KEYS]: { name: 'API Sleutels Beheren', description: 'Kan API-sleutels voor de organisatie aanmaken, inzien en intrekken.' },
  [PERMISSIONS.MANAGE_INTEGRATIONS]: { name: 'Integraties Beheren', description: 'Kan integraties met externe services zoals Slack en GitHub configureren.' },
  [PERMISSIONS.MANAGE_TEMPLATES]: { name: 'Templates Beheren', description: 'Kan taaktemplates voor de organisatie aanmaken, bewerken en verwijderen.' },
  [PERMISSIONS.MANAGE_TIME_TRACKING_INTEGRATIONS]: { name: 'Tijdregistratie Integraties Beheren', description: 'Kan integraties met tijdregistratietools zoals Toggl configureren.' },
};

export const DEFAULT_ROLES: Record<string, { name: string; permissions: Permission[] }> = {
  Owner: {
    name: 'Eigenaar',
    permissions: Object.values(PERMISSIONS),
  },
  Admin: {
    name: 'Beheerder',
    permissions: [
      PERMISSIONS.MANAGE_ORGANIZATION,
      PERMISSIONS.MANAGE_ROLES,
      PERMISSIONS.MANAGE_MEMBERS,
      PERMISSIONS.MANAGE_PROJECTS,
      PERMISSIONS.MANAGE_TEAMS,
      PERMISSIONS.CREATE_TASK,
      PERMISSIONS.EDIT_TASK,
      PERMISSIONS.DELETE_TASK,
      PERMISSIONS.ASSIGN_TASK,
      PERMISSIONS.VIEW_ALL_TASKS,
      PERMISSIONS.VIEW_AUDIT_LOG,
      PERMISSIONS.VIEW_SENSITIVE_DATA,
      PERMISSIONS.MANAGE_IDEAS,
      PERMISSIONS.MANAGE_API_KEYS,
      PERMISSIONS.MANAGE_INTEGRATIONS,
      PERMISSIONS.MANAGE_TEMPLATES,
      PERMISSIONS.MANAGE_TIME_TRACKING_INTEGRATIONS,
    ],
  },
  Member: {
    name: 'Lid',
    permissions: [
      PERMISSIONS.CREATE_TASK,
      PERMISSIONS.EDIT_TASK, // Note: Rules should enforce editing only assigned/created tasks
      PERMISSIONS.VIEW_ALL_TASKS,
    ],
  },
  Guest: {
    name: 'Gast',
    permissions: [], // Permissions for guests are handled by data scoping, not a permission flag.
  },
};
export type RoleName = string;

export type Project = {
  id: string;
  name: string;
  organizationId: string;
  teamIds?: string[];
  program?: string;
  isSensitive?: boolean;
  isPublic?: boolean;
  budget?: number;
  budgetType?: 'amount' | 'hours';
};

export type Team = {
  id: string;
  name: string;
  organizationId: string;
  memberIds: string[];
};

export type TeamChallenge = {
    id: string;
    organizationId: string;
    title: string;
    description: string;
    teamId: string;
    metric: 'tasks_completed' | 'points_earned';
    target: number;
    reward: number; // points
    status: 'active' | 'completed';
    createdAt: Date;
    completedAt?: Date;
}

export const teamChallengeFormSchema = z.object({
  title: z.string().min(3, 'Titel moet minimaal 3 karakters bevatten.'),
  description: z.string().optional(),
  teamId: z.string().min(1, 'Je moet een team selecteren.'),
  metric: z.enum(['tasks_completed', 'points_earned']),
  target: z.coerce.number().int().positive("Doel moet een positief getal zijn."),
  reward: z.coerce.number().int().positive("Beloning moet een positief getal zijn."),
});

export type TeamChallengeFormValues = z.infer<typeof teamChallengeFormSchema>;

export const USER_STATUSES: { value: 'Online' | 'Afwezig' | 'In vergadering' | 'Niet storen' | 'Offline'; label: string }[] = [
  { value: 'Online', label: 'Online' },
  { value: 'Afwezig', label: 'Afwezig' },
  { value: 'In vergadering', label: 'In vergadering' },
  { value: 'Niet storen', label: 'Niet storen' },
  { value: 'Offline', label: 'Offline' },
];

export const statusStyles: Record<string, { dot: string; label: string }> = {
  Online: { dot: 'bg-green-500', label: 'Online' },
  Afwezig: { dot: 'bg-yellow-500', label: 'Afwezig' },
  'In vergadering': { dot: 'bg-red-500', label: 'In vergadering' },
  'Niet storen': { dot: 'bg-purple-500', label: 'Niet storen' },
  Offline: { dot: 'bg-gray-400', label: 'Offline' },
};

export type UserStatus = {
  type: 'Online' | 'Afwezig' | 'In vergadering' | 'Niet storen' | 'Offline';
  until?: Date | null;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  points: number;
  bio?: string;
  timezone?: string;
  website?: string;
  location?: string;
  workingHours?: {
    startTime: string; // "HH:mm" format
    endTime: string; // "HH:mm" format
  };
  achievements: string[]; // Achievement IDs
  organizationIds?: string[];
  currentOrganizationId?: string | null;
  skills?: string[];
  endorsements?: Record<string, string[]>; // Map of skill to array of user IDs
  status: UserStatus;
  cosmetic?: {
    primaryColor?: string;
  },
  mutedTaskIds?: string[];
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorRecoveryCodes?: string[];
  notificationSettings?: {
    dailyDigestEnabled?: boolean;
    notificationPriorityThreshold?: Priority;
  };
  lastDigestSentAt?: Date;
  googleRefreshToken?: string | null;
  microsoftRefreshToken?: string | null;
  togglApiToken?: string;
  clockifyApiToken?: string;
  dashboardLayout?: Record<string, Layout[]>;
  streakData?: {
    currentStreak: number;
    lastCompletionDate: Date;
  };
  sessionPolicy?: {
    idleTimeoutSeconds?: number;
    absoluteTimeoutSeconds?: number;
  };
};

export type Session = {
  id: string;
  userId: string;
  createdAt: Date;
  lastAccessed: Date;
  userAgent: string;
  ipAddress?: string;
  isActive: boolean;
};

export const ACHIEVEMENTS = {
  FIRST_TASK: { 
    id: 'first_task', 
    name: 'Pionier', 
    description: 'Voltooi je allereerste taak.',
    icon: 'Rocket',
  },
  TEN_TASKS: { 
    id: 'ten_tasks', 
    name: 'Taakmeester', 
    description: 'Voltooi 10 taken.',
    icon: 'Award',
  },
   COMMUNITY_HELPER: {
    id: 'community_helper',
    name: 'Teamspeler',
    description: 'Voltooi een taak die door iemand anders is aangemaakt.',
    icon: 'Users',
  },
  APPRECIATED: {
    id: 'appreciated',
    name: 'Gewaardeerd',
    description: 'Ontvang een bedankje van een ander voor een voltooide taak.',
    icon: 'Heart',
  },
  PROJECT_COMPLETED: {
    id: 'project_completed',
    name: 'Project Voltooid',
    description: 'Je hebt met succes bijgedragen aan de voltooiing van een project.',
    icon: 'Medal',
  },
  TEAM_EFFORT: { 
    id: 'team_effort', 
    name: 'Geoliede Machine', 
    description: 'Voltooi als team 50 taken samen.',
    icon: 'Users',
  },
  PROJECT_DOMINATORS: { 
    id: 'project_dominators', 
    name: 'Project Dominators', 
    description: 'Voltooi als team 3 projecten.',
    icon: 'Briefcase',
  },
};

export type Priority = string;
export const ALL_PRIORITIES: Priority[] = ["Laag", "Midden", "Hoog", "Urgent"];


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
};

export type HistoryEntry = {
    id: string;
    userId: string;
    timestamp: Date;
    action: string;
    details?: string;
}

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
  createdAt: Date;
  completedAt?: Date;
  order: number;
  storyPoints?: number;
  cost?: number;
  blockedBy?: string[];
  dependencyConfig?: { [taskId: string]: { lag: number; unit: 'days' | 'hours' } };
  recurring?: Recurring;
  organizationId: string;
  imageDataUri?: string | null;
  thanked?: boolean;
  timeLogged?: number; // in seconds
  activeTimerStartedAt?: Date | null;
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
};

export type Notification = {
  id: string;
  userId: string;
  message: string;
  taskId?: string | null;
  read: boolean;
  createdAt: Date;
  snoozedUntil?: Date;
  archived?: boolean;
  organizationId: string;
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
  dueDate: z.date().optional(),
  priority: z.string().min(1, 'Prioriteit is verplicht.'),
  labels: z.array(z.string()).optional(),
  subtasks: z.array(subtaskSchema).optional(),
  attachments: z.array(z.object({ 
      name: z.string().min(1, 'Naam mag niet leeg zijn.'),
      url: z.string().url('Voer een geldige URL in.'),
    })).optional(),
  isPrivate: z.boolean().default(false),
  isSensitive: z.boolean().default(false),
  helpNeeded: z.boolean().default(false),
  storyPoints: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  blockedBy: z.array(z.string().min(1, 'ID mag niet leeg zijn.')).optional(),
  dependencyConfig: z.record(z.string(), z.object({ lag: z.coerce.number(), unit: z.enum(['days', 'hours']) })).optional(),
  recurring: recurringSchema.optional(),
  imageDataUri: z.string().optional(),
  reviewerId: z.string().optional(),
  consultedUserIds: z.array(z.string()).optional(),
  informedUserIds: z.array(z.string()).optional(),
  githubLinks: z.array(githubLinkSchema).optional(),
  githubLinkUrls: z.array(z.string()).optional(),
  gitlabLinks: z.array(gitlabLinkSchema).optional(),
  bitbucketLinks: z.array(bitbucketLinkSchema).optional(),
  jiraLinks: z.array(jiraLinkSchema).optional(),
  jiraLinkKeys: z.array(z.string()).optional(),
  togglWorkspaceId: z.coerce.number().optional(),
  togglProjectId: z.coerce.number().optional(),
  clockifyWorkspaceId: z.string().optional(),
  clockifyProjectId: z.string().optional(),
  customFieldValues: z.record(z.any()).optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const taskTemplateSchema = z.object({
  name: z.string().min(3, { message: "Templatenaam moet minimaal 3 karakters bevatten." }),
  title: z.string().min(3, { message: "Standaard titel moet minimaal 3 karakters bevatten." }),
  description: z.string().optional(),
  priority: z.string().min(1, 'Prioriteit is verplicht.'),
  labels: z.array(z.string()).optional().default([]),
  subtasks: z.array(z.object({ text: z.string().min(1) })).optional().default([]),
  attachments: z.array(z.object({
    name: z.string().min(1),
    url: z.string().url(),
  })).optional().default([]),
  storyPoints: z.coerce.number().optional(),
  recurring: recurringSchema.optional(),
  isPrivate: z.boolean().optional(),
  isSensitive: z.boolean().optional(),
});
export type TaskTemplateFormValues = z.infer<typeof taskTemplateSchema>;

export type TaskTemplate = TaskTemplateFormValues & {
  id: string;
  organizationId: string;
  creatorId: string;
  createdAt: Date;
};

export type Milestone = {
  id: string;
  text: string;
  completed: boolean;
};

export type PersonalGoal = {
  id: string;
  userId: string;
  organizationId: string;
  title: string;
  description?: string;
  targetDate?: Date;
  status: 'In Progress' | 'Achieved';
  milestones: Milestone[];
  createdAt: Date;
};

export const personalGoalFormSchema = z.object({
  title: z.string().min(3, 'Titel moet minimaal 3 karakters bevatten.'),
  description: z.string().optional(),
  targetDate: z.date().optional(),
  milestones: z.array(z.object({ text: z.string().min(1, "Mijlpaal mag niet leeg zijn.") })).optional(),
});

export type PersonalGoalFormValues = z.infer<typeof personalGoalFormSchema>;


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

export type Invite = {
    id: string;
    organizationId: string;
    organizationName: string;
    inviterId: string;
    status: 'pending' | 'accepted';
    createdAt: Date;
    projectId?: string;
};

export const WEBHOOK_EVENTS = {
  'task.created': 'Taak Aangemaakt',
  'task.updated': 'Taak Bijgewerkt',
  'task.deleted': 'Taak Verwijderd',
} as const;
export type WebhookEvent = keyof typeof WEBHOOK_EVENTS;

export type Webhook = {
  id: string;
  name: string;
  organizationId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  enabled: boolean;
  createdAt: Date;
};

export const webhookFormSchema = z.object({
  name: z.string().min(2, 'Naam moet minimaal 2 karakters bevatten.'),
  url: z.string().url('Voer een geldige URL in.'),
  events: z.array(z.nativeEnum(Object.keys(WEBHOOK_EVENTS))).min(1, 'Selecteer ten minste één gebeurtenis.'),
  enabled: z.boolean().default(true),
});
export type WebhookFormValues = z.infer<typeof webhookFormSchema>;

export type IdeaStatus = 'new' | 'planned' | 'in-progress' | 'completed';

export type Idea = {
    id: string;
    organizationId: string;
    creatorId: string;
    title: string;
    description: string;
    upvotes: string[];
    status: IdeaStatus;
    createdAt: Date;
};

export const ideaFormSchema = z.object({
    title: z.string().min(5, 'Titel moet minimaal 5 karakters bevatten.'),
    description: z.string().min(10, 'Omschrijving moet minimaal 10 karakters bevatten.'),
});
export type IdeaFormValues = z.infer<typeof ideaFormSchema>;

export type ActivityFeedItem = {
  id: string;
  organizationId: string;
  timestamp: Date;
  type: 'achievement' | 'kudos' | 'rating';
  userId: string; // The user who performed the action
  userName: string;
  userAvatar: string;
  details: {
    recipientId?: string;
    recipientName?: string;
    recipientIds?: string[];
    taskId?: string;
    taskTitle?: string;
    achievementId?: string;
    achievementName?: string;
    rating?: number;
    points?: number;
  };
};

export const API_PERMISSIONS = {
  'read:tasks': 'Lezen: Taken',
  'write:tasks': 'Schrijven: Taken',
  'delete:tasks': 'Verwijderen: Taken',
  'read:users': 'Lezen: Gebruikers',
  'read:projects': 'Lezen: Projecten',
  'write:projects': 'Schrijven: Projecten',
  'delete:projects': 'Verwijderen: Projecten',
  'read:teams': 'Lezen: Teams',
  'write:teams': 'Schrijven: Teams',
  'delete:teams': 'Verwijderen: Teams',
} as const;

export type ApiPermission = keyof typeof API_PERMISSIONS;

export type ApiKey = {
  id: string;
  organizationId: string;
  creatorId: string;
  name: string;
  hashedKey: string;
  keyPrefix: string;
  createdAt: Date;
  lastUsed?: Date;
  permissions: ApiPermission[];
};
