import { z } from 'zod';

export type User = {
  id: string;
  name: string;
  avatar: string;
  points: number;
  email: string;
};

export type Priority = "Laag" | "Midden" | "Hoog" | "Urgent";
export const ALL_PRIORITIES: Priority[] = ["Laag", "Midden", "Hoog", "Urgent"];


export type Status = "Te Doen" | "In Uitvoering" | "In Review" | "Voltooid" | "Gearchiveerd" | "Geannuleerd";

export const ALL_STATUSES: Status[] = ["Te Doen", "In Uitvoering", "In Review", "Voltooid", "Gearchiveerd", "Geannuleerd"];

export type Label = "Keuken" | "Woonkamer" | "Badkamer" | "Slaapkamer" | "Algemeen" | "Kantoor";

export const ALL_LABELS: Label[] = ["Keuken", "Woonkamer", "Badkamer", "Slaapkamer", "Algemeen", "Kantoor"];

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

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  dueDate?: Date;
  assigneeId: string | null;
  labels: Label[];
  subtasks: Subtask[];
  attachments: Attachment[];
  comments: Comment[];
  isPrivate: boolean;
  createdAt: Date;
  completedAt?: Date;
  order: number;
  storyPoints?: number;
  blockedBy?: string[];
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
  dueDate: z.date().optional(),
  priority: z.enum(['Laag', 'Midden', 'Hoog', 'Urgent']).default('Midden'),
  labels: z.array(z.string()).optional(),
  subtasks: z.array(z.object({ text: z.string().min(1, 'Subtaak mag niet leeg zijn.') })).optional(),
  attachments: z.array(z.object({ url: z.string().url('Voer een geldige URL in.') })).optional(),
  isPrivate: z.boolean().default(false),
  storyPoints: z.coerce.number().optional(),
  blockedBy: z.array(z.string().min(1, 'ID mag niet leeg zijn.')).optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export type Filters = {
  assigneeId: string | null;
  labels: Label[];
  priority: Priority | null;
};
