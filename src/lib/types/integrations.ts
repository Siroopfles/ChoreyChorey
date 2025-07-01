import { z } from 'zod';

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
  name: string;
  organizationId: string;
  creatorId: string;
  hashedKey: string;
  keyPrefix: string;
  createdAt: Date;
  lastUsed?: Date;
  permissions: ApiPermission[];
};
