import { z } from 'zod';
import { recurringSchema } from './tasks';

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

export const checklistTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Naam moet minimaal 2 karakters bevatten.'),
  subtasks: z.array(z.string().min(1, 'Subtaak mag niet leeg zijn.')),
  organizationId: z.string(),
  creatorId: z.string(),
  createdAt: z.date(),
});
export type ChecklistTemplate = z.infer<typeof checklistTemplateSchema>;

export const checklistTemplateFormSchema = checklistTemplateSchema.omit({
  id: true,
  organizationId: true,
  creatorId: true,
  createdAt: true,
});
export type ChecklistTemplateFormValues = z.infer<typeof checklistTemplateFormSchema>;
