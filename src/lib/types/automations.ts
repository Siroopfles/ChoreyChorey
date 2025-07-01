import { z } from 'zod';

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
