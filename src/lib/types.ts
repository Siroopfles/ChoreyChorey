

import { z } from 'zod';
import type { Layout } from 'react-grid-layout';
import { ROLE_ADMIN, ROLE_GUEST, ROLE_MEMBER, ROLE_OWNER } from './constants';

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

export const widgetConfigSchemas = {
  tasksByStatus: ChartWidgetConfigSchema,
  tasksByPriority: ChartWidgetConfigSchema,
  leaderboard: LeaderboardWidgetConfigSchema,
  myTasks: MyTasksWidgetConfigSchema,
  activityFeed: NoConfigSchema,
  recentActivity: NoConfigSchema,
  welcome: NoConfigSchema,
};

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

export const statusDefinitionSchema = z.object({
  name: z.string().min(1, "Naam mag niet leeg zijn."),
  color: z.string().regex(/^\d{1,3}(\.\d+)?\s\d{1,3}(\.\d+)?%\s\d{1,3}(\.\d+)?%$/, "Color must be a valid HSL string (e.g., '221.2 83.2% 53.3%')"),
});
export type StatusDefinition = z.infer<typeof statusDefinitionSchema>;

export const priorityDefinitionSchema = z.object({
  name: z.string().min(1, "Naam mag niet leeg zijn."),
  color: z.string().regex(/^\d{1,3}(\.\d+)?\s\d{1,3}(\.\d+)?%\s\d{1,3}(\.\d+)?%$/, "Color must be a valid HSL string (e.g., '221.2 83.2% 53.3%')"),
  icon: z.string().min(1, "Icoon naam is verplicht."),
});
export type PriorityDefinition = z.infer<typeof priorityDefinitionSchema>;

export type OrganizationSettings = {
  customization: {
    statuses: StatusDefinition[];
    labels: string[];
    priorities: PriorityDefinition[];
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
  },
  ipWhitelist?: string[];
}

export type Organization = {
  id: string;
  name: string;
  ownerId: string;
  dataResidency?: 'EU' | 'US';
  members: Record<string, OrganizationMember>; // Map of userId to their role info
  settings?: OrganizationSettings;
};

export type OrganizationMember = {
  role: RoleName;
  permissionOverrides?: {
    granted?: Permission[];
    revoked?: Permission[];
  };
  hasCompletedOnboarding?: boolean;
  points?: number;
  endorsements?: Record<string, string[]>;
  cosmetic?: {
    primaryColor?: string;
    font?: 'inter' | 'source-sans' | 'roboto-mono';
    radius?: string; // e.g., '0.5'
    accent?: string; // HSL value
  }
};

export const PERMISSIONS = {
  MANAGE_GENERAL_SETTINGS: 'MANAGE_GENERAL_SETTINGS',
  MANAGE_WORKFLOW: 'MANAGE_WORKFLOW',
  MANAGE_ROLES: 'MANAGE_ROLES',
  MANAGE_MEMBERS: 'MANAGE_MEMBERS',
  MANAGE_MEMBER_PERMISSIONS: 'MANAGE_MEMBER_PERMISSIONS',
  MANAGE_PROJECTS: 'MANAGE_PROJECTS',
  MANAGE_PROJECT_ROLES: 'MANAGE_PROJECT_ROLES',
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
  MANAGE_SECURITY_SETTINGS: 'MANAGE_SECURITY_SETTINGS',
  MANAGE_IP_WHITELIST: 'MANAGE_IP_WHITELIST',
  MANAGE_ANNOUNCEMENTS: 'MANAGE_ANNOUNCEMENTS',
  MANAGE_BRANDING: 'MANAGE_BRANDING',
  MANAGE_SAVED_FILTERS: 'MANAGE_SAVED_FILTERS',
  MANAGE_FEATURE_TOGGLES: 'MANAGE_FEATURE_TOGGLES',
  PIN_ITEMS: 'PIN_ITEMS',
  MANAGE_AUTOMATIONS: 'MANAGE_AUTOMATIONS',
  MANAGE_WEBHOOKS: 'MANAGE_WEBHOOKS',
  MANAGE_GOALS: 'MANAGE_GOALS',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const PERMISSIONS_DESCRIPTIONS: Record<Permission, { name: string, description: string }> = {
  [PERMISSIONS.MANAGE_GENERAL_SETTINGS]: { name: 'Algemene Instellingen Beheren', description: 'Kan de naam van de organisatie aanpassen.' },
  [PERMISSIONS.MANAGE_WORKFLOW]: { name: 'Workflow Beheren', description: 'Kan statussen, labels, prioriteiten en eigen velden aanpassen.' },
  [PERMISSIONS.MANAGE_ROLES]: { name: 'Rollen Beheren', description: 'Kan rollen en hun permissies aanmaken en aanpassen.' },
  [PERMISSIONS.MANAGE_MEMBERS]: { name: 'Leden Beheren', description: 'Kan leden uitnodigen voor en verwijderen uit de organisatie.' },
  [PERMISSIONS.MANAGE_MEMBER_PERMISSIONS]: { name: 'Lid Permissies Beheren', description: 'Kan individuele permissies van leden overschrijven, los van hun rol.' },
  [PERMISSIONS.MANAGE_PROJECTS]: { name: 'Projecten Beheren', description: 'Kan projecten aanmaken, bewerken en verwijderen.' },
  [PERMISSIONS.MANAGE_PROJECT_ROLES]: { name: 'Projectrollen Beheren', description: 'Kan de rol van een gebruiker binnen een specifiek project aanpassen.' },
  [PERMISSIONS.MANAGE_TEAMS]: { name: 'Teams Beheren', description: 'Kan teams aanmaken en de leden van teams beheren.' },
  [PERMISSIONS.CREATE_TASK]: { name: 'Taken Aanmaken', description: 'Kan nieuwe taken aanmaken binnen de organisatie.' },
  [PERMISSIONS.EDIT_TASK]: { name: 'Taken Bewerken', description: 'Kan de details van bestaande taken aanpassen.' },
  [PERMISSIONS.DELETE_TASK]: { name: 'Taken Verwijderen', description: 'Kan taken naar de prullenbak verplaatsen of permanent verwijderen.' },
  [PERMISSIONS.ASSIGN_TASK]: { name: 'Taken Toewijzen', description: 'Kan taken toewijzen aan leden van de organisatie.' },
  [PERMISSIONS.VIEW_ALL_TASKS]: { name: 'Alle Taken Zien', description: 'Kan alle niet-privé taken binnen de organisatie bekijken.' },
  [PERMISSIONS.VIEW_AUDIT_LOG]: { name: 'Audit Log Bekijken', description: 'Heeft toegang tot de audit log met alle acties binnen de organisatie.' },
  [PERMISSIONS.VIEW_SENSITIVE_DATA]: { name: 'Gevoelige Data Zien', description: 'Kan de inhoud van taken zien die als "gevoelig" zijn gemarkeerd.' },
  [PERMISSIONS.MANAGE_IDEAS]: { name: 'Ideeën Beheren', description: 'Kan de status van ideeën in de ideeënbus aanpassen.' },
  [PERMISSIONS.MANAGE_API_KEYS]: { name: 'API Sleutels Beheren', description: 'Kan API-sleutels voor de organisatie aanmaken, inzien en intrekken.' },
  [PERMISSIONS.MANAGE_INTEGRATIONS]: { name: 'Integraties Beheren', description: 'Kan integraties met externe services zoals Slack en GitHub configureren.' },
  [PERMISSIONS.MANAGE_TEMPLATES]: { name: 'Templates Beheren', description: 'Kan taaktemplates voor de organisatie aanmaken, bewerken en verwijderen.' },
  [PERMISSIONS.MANAGE_SECURITY_SETTINGS]: { name: 'Beveiligingsinstellingen Beheren', description: 'Kan sessiebeleid en andere beveiligingsopties beheren.' },
  [PERMISSIONS.MANAGE_IP_WHITELIST]: { name: 'IP Whitelist Beheren', description: 'Kan de lijst met toegestane IP-adressen voor de organisatie beheren.' },
  [PERMISSIONS.MANAGE_ANNOUNCEMENTS]: { name: 'Aankondigingen Beheren', description: 'Kan organisatie-brede aankondigingen plaatsen en verwijderen.' },
  [PERMISSIONS.MANAGE_BRANDING]: { name: 'Branding Beheren', description: 'Kan het uiterlijk, zoals kleuren en logo, van de organisatie aanpassen.' },
  [PERMISSIONS.MANAGE_SAVED_FILTERS]: { name: 'Opgeslagen Filters Beheren', description: 'Kan opgeslagen filters van andere gebruikers verwijderen.' },
  [PERMISSIONS.MANAGE_FEATURE_TOGGLES]: { name: 'Feature Vlaggen Beheren', description: 'Kan kernfunctionaliteiten en integraties voor de organisatie in- of uitschakelen.' },
  [PERMISSIONS.PIN_ITEMS]: { name: 'Items Vastpinnen', description: 'Kan taken en projecten vastpinnen in de zijbalk voor iedereen in de organisatie.' },
  [PERMISSIONS.MANAGE_AUTOMATIONS]: { name: 'Automatiseringen Beheren', description: 'Kan automatiseringen voor de organisatie aanmaken, bewerken en verwijderen.' },
  [PERMISSIONS.MANAGE_WEBHOOKS]: { name: 'Webhooks Beheren', description: 'Kan webhooks voor de organisatie aanmaken, bewerken en verwijderen.' },
  [PERMISSIONS.MANAGE_GOALS]: { name: 'Doelen & Uitdagingen Beheren', description: 'Kan team-brede uitdagingen aanmaken, bewerken en verwijderen.' },
};

export const DEFAULT_ROLES: Record<string, { name: string; permissions: Permission[] }> = {
  [ROLE_OWNER]: {
    name: 'Eigenaar',
    permissions: Object.values(PERMISSIONS),
  },
  [ROLE_ADMIN]: {
    name: 'Beheerder',
    permissions: [
      PERMISSIONS.MANAGE_GENERAL_SETTINGS,
      PERMISSIONS.MANAGE_WORKFLOW,
      PERMISSIONS.MANAGE_ROLES,
      PERMISSIONS.MANAGE_MEMBERS,
      PERMISSIONS.MANAGE_MEMBER_PERMISSIONS,
      PERMISSIONS.MANAGE_PROJECTS,
      PERMISSIONS.MANAGE_PROJECT_ROLES,
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
      PERMISSIONS.MANAGE_SECURITY_SETTINGS,
      PERMISSIONS.MANAGE_IP_WHITELIST,
      PERMISSIONS.MANAGE_ANNOUNCEMENTS,
      PERMISSIONS.MANAGE_BRANDING,
      PERMISSIONS.MANAGE_SAVED_FILTERS,
      PERMISSIONS.MANAGE_FEATURE_TOGGLES,
      PERMISSIONS.PIN_ITEMS,
      PERMISSIONS.MANAGE_AUTOMATIONS,
      PERMISSIONS.MANAGE_WEBHOOKS,
      PERMISSIONS.MANAGE_GOALS,
    ],
  },
  [ROLE_MEMBER]: {
    name: 'Lid',
    permissions: [
      PERMISSIONS.CREATE_TASK,
      PERMISSIONS.EDIT_TASK,
      PERMISSIONS.VIEW_ALL_TASKS,
      PERMISSIONS.PIN_ITEMS,
    ],
  },
  [ROLE_GUEST]: {
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
  deadline?: Date;
  pinned?: boolean;
  projectRoles?: Record<string, RoleName>;
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

export type GlobalUserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  organizationIds?: string[];
  currentOrganizationId?: string | null;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  twoFactorRecoveryCodes?: string[] | null;
  googleRefreshToken?: string | null;
  microsoftRefreshToken?: string | null;
  togglApiToken?: string;
  clockifyApiToken?: string;
  dashboardLayout?: Record<string, Layout[]>;
  dashboardConfig?: WidgetInstance[];
  bio?: string;
  timezone?: string;
  website?: string;
  location?: string;
  notificationSounds?: Record<string, string>;
  showTour?: boolean;
}

export type User = GlobalUserProfile & OrganizationMember & {
  points: number; // For simplicity in leaderboard/gamification
  skills?: string[];
  status: UserStatus;
  mutedTaskIds?: string[];
  notificationSettings?: {
    dailyDigestEnabled?: boolean;
    notificationPriorityThreshold?: Priority;
  };
  lastDigestSentAt?: Date;
  streakData?: {
    currentStreak: number;
    lastCompletionDate: Date;
  };
  workingHours?: {
    startTime: string; // "HH:mm" format
    endTime: string; // "HH:mm" format
  };
};

export type Session = {
  id: string;
  userId: string;
  createdAt: Date;
  lastAccessed: Date;
  userAgent: string;
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

export const taskRelationTypeSchema = z.enum(['related_to', 'duplicate_of']);
export type TaskRelationType = z.infer<typeof taskRelationTypeSchema>;

export const taskRelationSchema = z.object({
  taskId: z.string(),
  type: taskRelationTypeSchema,
});
export type TaskRelation = z.infer<typeof taskRelationSchema>;

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
  storyPoints?: number;
  cost?: number;
  blockedBy?: string[];
  relations?: TaskRelation[];
  dependencyConfig?: { [taskId: string]: { lag: number; unit: 'days' | 'hours' } };
  recurring?: Recurring;
  organizationId: string;
  imageUrl?: string | null;
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
  pinned?: boolean;
};

export const NOTIFICATION_EVENT_TYPES_FOR_SOUNDS = {
  'default': 'Standaard Notificatie',
  'assignment': 'Nieuwe Toewijzing',
  'comment': 'Nieuwe Reactie',
  'mention': 'Nieuwe Vermelding',
  'status_change': 'Statuswijziging',
  'gamification': 'Gamification & Beloning',
} as const;

export const NOTIFICATION_SOUNDS = [
  { id: 'none', name: 'Geen geluid' },
  { id: 'chime.mp3', name: 'Klokkenspel' },
  { id: 'bubble.mp3', name: 'Bubbel' },
  { id: 'swoosh.mp3', name: 'Swoosh' },
  { id: 'ding.mp3', name: 'Ding' },
  { id: 'tada.mp3', name: 'Tada!' },
];


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
  eventType?: 'comment' | 'assignment' | 'mention' | 'status_change' | 'review_request' | 'gamification' | 'integration' | 'system' | 'automation' | 'ai_suggestion' | string;
  bundleCount?: number;
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
  isBlocked: z.boolean().optional(),
  helpNeeded: z.boolean().default(false),
  storyPoints: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  blockedBy: z.array(z.string().min(1, 'ID mag niet leeg zijn.')).optional(),
  relations: z.array(taskRelationSchema).optional(),
  dependencyConfig: z.record(z.string(), z.object({ lag: z.coerce.number(), unit: z.enum(['days', 'hours']) })).optional(),
  recurring: recurringSchema.optional(),
  imageUrl: z.string().optional(),
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

export const AUTOMATION_TRIGGER_TYPES = {
  'task.created': 'Taak Aangemaakt',
  'task.status.changed': 'Status van taak gewijzigd',
  'task.priority.changed': 'Prioriteit van taak gewijzigd',
  'task.label.added': 'Label toegevoegd aan taak',
} as const;
export type AutomationTriggerType = keyof typeof AUTOMATION_TRIGGER_TYPES;

export const AUTOMATION_ACTION_TYPES = {
  'task.assign': 'Taak Toewijzen',
  'task.set.priority': 'Prioriteit instellen',
  'task.add.label': 'Label toevoegen',
  'task.add.comment': 'Reactie toevoegen',
} as const;
export type AutomationActionType = keyof typeof AUTOMATION_ACTION_TYPES;

export const automationTriggerSchema = z.object({
  type: z.nativeEnum(Object.keys(AUTOMATION_TRIGGER_TYPES)),
  filters: z.object({
    priority: z.string().optional(), // Used by task.created and task.priority.changed
    label: z.string().optional(), // Used by task.created and task.label.added
    status: z.string().optional(), // Used by task.status.changed
  }).optional(),
});

export const automationActionSchema = z.object({
  type: z.nativeEnum(Object.keys(AUTOMATION_ACTION_TYPES)),
  params: z.object({
    assigneeId: z.string().optional(),
    priority: z.string().optional(),
    label: z.string().optional(),
    commentText: z.string().optional(),
  }),
});

export const automationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Naam is vereist.'),
  organizationId: z.string(),
  creatorId: z.string(),
  createdAt: z.date(),
  enabled: z.boolean(),
  trigger: automationTriggerSchema,
  action: automationActionSchema,
});
export type Automation = z.infer<typeof automationSchema>;

export const automationFormSchema = automationSchema.pick({
    name: true,
    enabled: true,
    trigger: true,
    action: true,
});
export type AutomationFormValues = z.infer<typeof automationFormSchema>;

// Roadmap specific types
export type Feature = {
  id: number;
  title: string;
  description: string;
  completed: boolean;
};

export type Phase = {
  name: string;
  description: string;
  features: Feature[];
};

