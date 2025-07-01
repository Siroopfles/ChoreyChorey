import type { Layout } from 'react-grid-layout';
import type { Timestamp } from 'firebase/firestore';
import type { OrganizationMember } from './organizations';
import type { WidgetInstance } from './ui';

export type UserStatus = {
  type: 'Online' | 'Afwezig' | 'In vergadering' | 'Niet storen' | 'Offline';
  until?: Date | null;
  currentPage?: string;
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
  fcmTokens?: string[];
}

export type User = GlobalUserProfile & OrganizationMember & {
  points: number; // For simplicity in leaderboard/gamification
  skills?: string[];
  status: UserStatus;
  mutedTaskIds?: string[];
  notificationSettings?: {
    dailyDigestEnabled?: boolean;
    notificationPriorityThreshold?: 'Laag' | 'Midden' | 'Hoog' | 'Urgent';
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
