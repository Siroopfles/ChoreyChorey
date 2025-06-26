
import { z } from 'zod';

export type OrganizationSettings = {
  customization: {
    statuses: string[];
    labels: string[];
    priorities: string[];
    customRoles?: Record<string, { name: string; permissions: Permission[] }>;
  },
  features?: {
    gamification: boolean;
    storyPoints: boolean;
    timeTracking: boolean;
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
  MANAGE_TEAMS: 'MANAGE_TEAMS',
  CREATE_TASK: 'CREATE_TASK',
  EDIT_TASK: 'EDIT_TASK',
  DELETE_TASK: 'DELETE_TASK',
  ASSIGN_TASK: 'ASSIGN_TASK',
  VIEW_ALL_TASKS: 'VIEW_ALL_TASKS',
  VIEW_AUDIT_LOG: 'VIEW_AUDIT_LOG',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const PERMISSIONS_DESCRIPTIONS: Record<Permission, { name: string, description: string }> = {
  [PERMISSIONS.MANAGE_ORGANIZATION]: { name: 'Organisatie Beheren', description: 'Kan de naam, workflow en feature instellingen van de organisatie aanpassen.' },
  [PERMISSIONS.MANAGE_ROLES]: { name: 'Rollen Beheren', description: 'Kan de rollen van andere leden aanpassen (behalve de eigenaar).' },
  [PERMISSIONS.MANAGE_MEMBERS]: { name: 'Leden Beheren', description: 'Kan leden uitnodigen voor en verwijderen uit de organisatie.' },
  [PERMISSIONS.MANAGE_TEAMS]: { name: 'Teams Beheren', description: 'Kan teams aanmaken en de leden van teams beheren.' },
  [PERMISSIONS.CREATE_TASK]: { name: 'Taken Aanmaken', description: 'Kan nieuwe taken aanmaken binnen de organisatie.' },
  [PERMISSIONS.EDIT_TASK]: { name: 'Taken Bewerken', description: 'Kan de details van bestaande taken aanpassen.' },
  [PERMISSIONS.DELETE_TASK]: { name: 'Taken Verwijderen', description: 'Kan taken annuleren of permanent verwijderen.' },
  [PERMISSIONS.ASSIGN_TASK]: { name: 'Taken Toewijzen', description: 'Kan taken toewijzen aan leden van de organisatie.' },
  [PERMISSIONS.VIEW_ALL_TASKS]: { name: 'Alle Taken Zien', description: 'Kan alle niet-privé taken binnen de organisatie bekijken.' },
  [PERMISSIONS.VIEW_AUDIT_LOG]: { name: 'Audit Log Bekijken', description: 'Heeft toegang tot de audit log met alle acties binnen de organisatie.' },
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
      PERMISSIONS.MANAGE_TEAMS,
      PERMISSIONS.CREATE_TASK,
      PERMISSIONS.EDIT_TASK,
      PERMISSIONS.DELETE_TASK,
      PERMISSIONS.ASSIGN_TASK,
      PERMISSIONS.VIEW_ALL_TASKS,
      PERMISSIONS.VIEW_AUDIT_LOG,
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
};
export type RoleName = string;


export type Team = {
  id: string;
  name: string;
  organizationId: string;
  memberIds: string[];
  program?: string;
};

export type User = {
  id: string;
  name: string;
  avatar: string;
  points: number;
  email: string;
  achievements: string[]; // Achievement IDs
  organizationIds?: string[];
  currentOrganizationId?: string | null;
  skills?: string[];
  endorsements?: Record<string, string[]>; // Map of skill to array of user IDs
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
  }
};

export type Priority = string;
export const ALL_PRIORITIES: Priority[] = ["Laag", "Midden", "Hoog", "Urgent"];


export type Status = string;
export type Label = string;
export const ALL_SKILLS: string[] = ["Koken", "Schoonmaken", "Tuinieren", "Techniek", "Administratie", "Organiseren", "Boodschappen", "Dierenverzorging", "Planning", "Communicatie"];

export const monthlyRecurringSchema = z.union([
  z.object({
    type: z.literal('day_of_month'),
    day: z.number().min(1).max(31),
  }),
  z.object({
    type: z.literal('day_of_week'),
    week: z.enum(['first', 'second', 'third', 'fourth', 'last']),
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    weekday: z.number().min(0).max(6),
  })
]);

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
  teamId?: string | null;
  labels: Label[];
  subtasks: Subtask[];
  attachments: Attachment[];
  comments: Comment[];
  history: HistoryEntry[];
  isPrivate: boolean;
  createdAt: Date;
  completedAt?: Date;
  order: number;
  storyPoints?: number;
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
};

export type Notification = {
  id: string;
  userId: string;
  message: string;
  taskId?: string;
  read: boolean;
  createdAt: Date;
  snoozedUntil?: Date;
  archived?: boolean;
  organizationId: string;
};

export const subtaskSchema = z.object({
    text: z.string().min(1, 'Subtaak mag niet leeg zijn.'),
    isPrivate: z.boolean().optional(),
});

export const taskFormSchema = z.object({
  title: z.string().min(3, 'Titel moet minimaal 3 karakters lang zijn.'),
  description: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
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
  storyPoints: z.coerce.number().optional(),
  blockedBy: z.array(z.string().min(1, 'ID mag niet leeg zijn.')).optional(),
  dependencyConfig: z.record(z.string(), z.object({ lag: z.coerce.number(), unit: z.enum(['days', 'hours']) })).optional(),
  recurring: recurringSchema.optional(),
  imageDataUri: z.string().optional(),
  reviewerId: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const taskTemplateSchema = z.object({
  name: z.string().min(3, { message: "Templatenaam moet minimaal 3 karakters bevatten." }),
  title: z.string().min(3, { message: "Standaard titel moet minimaal 3 karakters bevatten." }),
  description: z.string().optional(),
  priority: z.string().min(1, 'Prioriteit is verplicht.'),
  labels: z.array(z.string()).optional().default([]),
  subtasks: z.array(z.object({ text: z.string().min(1) })).optional().default([]),
  storyPoints: z.coerce.number().optional(),
});
export type TaskTemplateFormValues = z.infer<typeof taskTemplateSchema>;

export type TaskTemplate = TaskTemplateFormValues & {
  id: string;
  organizationId: string;
  creatorId: string;
  createdAt: Date;
};


export type Filters = {
  assigneeId: string | null;
  labels: string[];
  priority: Priority | null;
  teamId: string | null;
};

export type Invite = {
    id: string;
    organizationId: string;
    organizationName: string;
    inviterId: string;
    status: 'pending' | 'accepted';
    createdAt: Date;
};
