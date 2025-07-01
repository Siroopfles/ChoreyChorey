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
  },
  APPRECIATED: {
    id: 'appreciated',
    name: 'Gewaardeerd',
    description: 'Ontvang een bedankje van een ander voor een voltooide taak.',
    icon: 'Heart',
  },
  PROJECT_COMPLETED: {
    id: 'project_completed',
    name: 'Project Voltooid',
    description: 'Je hebt met succes bijgedragen aan de voltooiing van een project.',
    icon: 'Medal',
  },
  TEAM_EFFORT: { 
    id: 'team_effort', 
    name: 'Geoliede Machine', 
    description: 'Voltooi als team 50 taken samen.',
    icon: 'Users',
  },
  PROJECT_DOMINATORS: { 
    id: 'project_dominators', 
    name: 'Project Dominators', 
    description: 'Voltooi als team 3 projecten.',
    icon: 'Briefcase',
  },
};

export type ActivityFeedItem = {
  id: string;
  organizationId: string;
  timestamp: Date;
  type: 'achievement' | 'kudos' | 'rating';
  userId: string; // The user who performed the action
  userName: string;
  userAvatar: string;
  details: {
    recipientId?: string;
    recipientName?: string;
    recipientIds?: string[];
    taskId?: string;
    taskTitle?: string;
    achievementId?: string;
    achievementName?: string;
    rating?: number;
    points?: number;
  };
};
