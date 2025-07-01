import type { RoleName } from './permissions';

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
  budgetNotificationSent?: boolean;
};
