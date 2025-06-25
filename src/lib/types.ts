import { z } from 'zod';

export type Organization = {
  id: string;
  name: string;
  ownerId: string;
};

export type Team = {
  id: string;
  name: string;
  organizationId: string;
  memberIds: string[];
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
  }
};

export type Priority = "Laag" | "Midden" | "Hoog" | "Urgent";
export const ALL_PRIORITIES: Priority[] = ["Laag", "Midden", "Hoog", "Urgent"];


export type Status = "Te Doen" | "In Uitvoering" | "In Review" | "Voltooid" | "Gearchiveerd" | "Geannuleerd";

export const ALL_STATUSES: Status[] = ["Te Doen", "In Uitvoering", "In Review", "Voltooid", "Gearchiveerd", "Geannuleerd"];

export type Label = "Keuken" | "Woonkamer" | "Badkamer" | "Slaapkamer" | "Algemeen" | "Kantoor";

export const ALL_LABELS: Label[] = ["Keuken", "Woonkamer", "Badkamer", "Slaapkamer", "Algemeen", "Kantoor"];

export type RecurringFrequency = "daily" | "weekly" | "monthly";
export const ALL_RECURRING_FREQUENCIES: RecurringFrequency[] = ["daily", "weekly", "monthly"];

export type Subtask = {
  id: string;
  text: string;
  completed: boolean;
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
  assigneeId: string | null;
  creatorId: string | null;
  teamId?: string;
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
  recurring?: RecurringFrequency;
  organizationId: string;
};

export type Notification = {
  id: string;
  userId: string;
  message: string;
  taskId?: string;
  read: boolean;
  createdAt: Date;
};

export const taskFormSchema = z.object({
  title: z.string().min(3, 'Titel moet minimaal 3 karakters lang zijn.'),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  teamId: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.enum(['Laag', 'Midden', 'Hoog', 'Urgent']).default('Midden'),
  labels: z.array(z.string()).optional(),
  subtasks: z.array(z.object({ text: z.string().min(1, 'Subtaak mag niet leeg zijn.') })).optional(),
  attachments: z.array(z.object({ 
      name: z.string().min(1, 'Naam mag niet leeg zijn.'),
      url: z.string().url('Voer een geldige URL in.'),
    })).optional(),
  isPrivate: z.boolean().default(false),
  storyPoints: z.coerce.number().optional(),
  blockedBy: z.array(z.string().min(1, 'ID mag niet leeg zijn.')).optional(),
  recurring: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export type Filters = {
  assigneeId: string | null;
  labels: Label[];
  priority: Priority | null;
};
