export const NOTIFICATION_EVENT_TYPES_FOR_SOUNDS = {
  'default': 'Standaard Notificatie',
  'assignment': 'Nieuwe Toewijzing',
  'comment': 'Nieuwe Reactie',
  'mention': 'Nieuwe Vermelding',
  'status_change': 'Statuswijziging',
  'gamification': 'Gamification & Beloning',
} as const;

export const NOTIFICATION_SOUNDS = [
  { id: 'none', name: 'Geen geluid' },
  { id: 'chime.mp3', name: 'Klokkenspel' },
  { id: 'bubble.mp3', name: 'Bubbel' },
  { id: 'swoosh.mp3', name: 'Swoosh' },
  { id: 'ding.mp3', name: 'Ding' },
  { id: 'tada.mp3', name: 'Tada!' },
];


export type Notification = {
  id: string;
  userId: string;
  message: string;
  taskId?: string | null;
  read: boolean;
  createdAt: Date;
  snoozedUntil?: Date;
  archived?: boolean;
  organizationId: string;
  fromUserId: string;
  eventType?: 'comment' | 'assignment' | 'mention' | 'status_change' | 'review_request' | 'gamification' | 'integration' | 'system' | 'automation' | 'ai_suggestion' | string;
  bundleCount?: number;
};
