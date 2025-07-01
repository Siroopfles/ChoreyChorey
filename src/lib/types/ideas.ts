import { z } from 'zod';

export type IdeaStatus = 'new' | 'planned' | 'in-progress' | 'completed';

export type Idea = {
    id: string;
    organizationId: string;
    creatorId: string;
    title: string;
    description: string;
    upvotes: string[];
    status: IdeaStatus;
    createdAt: Date;
};

export const ideaFormSchema = z.object({
    title: z.string().min(5, 'Titel moet minimaal 5 karakters bevatten.'),
    description: z.string().min(10, 'Omschrijving moet minimaal 10 karakters bevatten.'),
});
export type IdeaFormValues = z.infer<typeof ideaFormSchema>;
