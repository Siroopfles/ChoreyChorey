
import type { Layouts } from 'react-grid-layout';
import type { Timestamp } from 'firebase/firestore';
import type { OrganizationMember } from './organizations';
import type { WidgetInstance } from './ui';
import type { Priority } from './tasks';

export const USER_STATUSES: { value: 'Online' | 'Afwezig' | 'In vergadering' | 'Niet storen' | 'Offline'; label: string }[] = [
  { value: 'Online', label: 'Online' },
  { value: 'Afwezig', label: 'Afwezig' },
  { value: 'In vergadering', label: 'In vergadering' },
  { value: 'Niet storen', label: 'Niet storen' },
  { value: 'Offline', label: 'Offline' },
];

export type UserStatus = {
  type: 'Online' | 'Afwezig' | 'In vergadering' | 'Niet storen' | 'Offline';
  until?: Date | null;
  currentPage?: string;
};

export type CosmeticSettings = {
  primaryColor?: string;
  font?: 'pt-sans' | 'source-sans-3' | 'roboto-mono';
  radius?: string; // e.g., '0.5'
  accent?: string; // HSL value
}

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
  dashboardLayout?: Layouts;
  dashboardConfig?: WidgetInstance[];
  bio?: string;
  timezone?: string;
  website?: string;
  location?: string;
  notificationSounds?: Record<string, string>;
  showTour?: boolean;
  fcmTokens?: string[];
  cosmetic?: CosmeticSettings;
}

export type User = GlobalUserProfile & OrganizationMember & {
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

export type Presence = {
  id: string; // same as userId
  organizationId: string;
  cursor: { x: number; y: number } | null;
  name: string;
  avatar: string;
  lastSeen: Timestamp;
  viewingTaskId?: string | null;
};
