import { z } from 'zod';
import type { Permission, RoleName } from './permissions';
import type { SavedFilter } from './ui';

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

export const customFieldDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['text', 'number', 'date', 'select']),
  options: z.array(z.string()).optional(), // Only for 'select' type
});
export type CustomFieldDefinition = z.infer<typeof customFieldDefinitionSchema>;

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
  notificationThresholds?: {
    projectBudget?: {
      enabled: boolean;
      percentage: number;
    };
  };
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
  endorsements?: Record<string, string[]>; // skillName: [userId, userId, ...]
  cosmetic?: {
    primaryColor?: string;
    font?: 'inter' | 'source-sans' | 'roboto-mono';
    radius?: string; // e.g., '0.5'
    accent?: string; // HSL value
  }
};

export type Team = {
  id: string;
  name: string;
  organizationId: string;
  memberIds: string[];
};
