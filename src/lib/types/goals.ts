import { z } from 'zod';

export type Milestone = {
  id: string;
  text: string;
  completed: boolean;
};

export type PersonalGoal = {
  id: string;
  userId: string;
  organizationId: string;
  title: string;
  description?: string;
  targetDate?: Date;
  status: 'In Progress' | 'Achieved';
  milestones: Milestone[];
  createdAt: Date;
};

export const personalGoalFormSchema = z.object({
  title: z.string().min(3, 'Titel moet minimaal 3 karakters bevatten.'),
  description: z.string().optional(),
  targetDate: z.date().optional(),
  milestones: z.array(z.object({ text: z.string().min(1, "Mijlpaal mag niet leeg zijn.") })).optional(),
});

export type PersonalGoalFormValues = z.infer<typeof personalGoalFormSchema>;

export type TeamChallenge = {
    id: string;
    organizationId: string;
    title: string;
    description: string;
    teamId: string;
    metric: 'tasks_completed' | 'points_earned';
    target: number;
    reward: number; // points
    status: 'active' | 'completed';
    createdAt: Date;
    completedAt?: Date;
}

export const teamChallengeFormSchema = z.object({
  title: z.string().min(3, 'Titel moet minimaal 3 karakters bevatten.'),
  description: z.string().optional(),
  teamId: z.string().min(1, 'Je moet een team selecteren.'),
  metric: z.enum(['tasks_completed', 'points_earned']),
  target: z.coerce.number().int().positive("Doel moet een positief getal zijn."),
  reward: z.coerce.number().int().positive("Beloning moet een positief getal zijn."),
});

export type TeamChallengeFormValues = z.infer<typeof teamChallengeFormSchema>;
