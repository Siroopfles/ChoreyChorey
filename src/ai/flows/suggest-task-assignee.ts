'use server';

/**
 * @fileOverview AI agent that suggests the optimal task assignee.
 *
 * - suggestTaskAssignee - A function that suggests the optimal task assignee.
 * - SuggestTaskAssigneeInput - The input type for the suggestTaskAssignee function.
 * - SuggestTaskAssigneeOutput - The return type for the suggestTaskAssignee function.
 */

import {ai} from '@/ai/genkit';
import { SuggestTaskAssigneeInputSchema, SuggestTaskAssigneeOutputSchema } from '@/ai/schemas';
import type { SuggestTaskAssigneeInput, SuggestTaskAssigneeOutput } from '@/ai/schemas';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';


async function getTaskHistory(organizationId: string) {
    const tasksQuery = query(collection(db, 'tasks'), where('organizationId', '==', organizationId), where('status', '==', 'Voltooid'));
    const usersQuery = query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId));

    const [tasksSnapshot, usersSnapshot] = await Promise.all([
        getDocs(tasksQuery),
        getDocs(usersSnapshot)
    ]);

    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    const userMap = new Map(users.map(u => [u.id, u]));

    return tasksSnapshot.docs.map(doc => {
        const task = doc.data();
        const assignee = task.assigneeIds.map((id: string) => userMap.get(id)?.name).filter(Boolean).join(', ');
        const completedAt = (task.completedAt as Timestamp)?.toDate();
        const createdAt = (task.createdAt as Timestamp)?.toDate();

        return {
            assignee: assignee || 'Unknown',
            taskDescription: task.description,
            completionTime: (completedAt && createdAt) ? (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60) : 0, // in hours
        };
    }).filter(th => th.completionTime > 0);
};

export async function suggestTaskAssignee(taskDescription: string, organizationId: string): Promise<SuggestTaskAssigneeOutput> {
  const orgUsersSnapshot = await getDocs(query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId)));
  const orgUsers = orgUsersSnapshot.docs.map(doc => doc.data() as User);

  if (orgUsers.length === 0) {
      return { suggestedAssignee: 'Niemand', reasoning: 'Er zijn geen gebruikers in deze organisatie om aan toe te wijzen.' };
  }

  const assigneeSkills = orgUsers.reduce((acc, user) => {
      acc[user.name] = user.skills || [];
      return acc;
  }, {} as Record<string, string[]>);
  
  const taskHistory = await getTaskHistory(organizationId);

  return suggestTaskAssigneeFlow({ taskDescription, assigneeSkills, taskHistory });
}

const prompt = ai.definePrompt({
  name: 'suggestTaskAssigneePrompt',
  input: {schema: SuggestTaskAssigneeInputSchema},
  output: {schema: SuggestTaskAssigneeOutputSchema},
  model: 'gemini-pro',
  prompt: `Je bent een AI-assistent voor het toewijzen van taken. Je doel is om de optimale persoon voor te stellen voor een bepaalde taak, rekening houdend met hun historische prestaties en vaardigheden.

Taakomschrijving: {{{taskDescription}}}

{{#if assigneeSkills}}
Beschikbare Toewijzers en hun vaardigheden:
{{#each assigneeSkills}}
- {{@key}}: {{#if this}}{{#each this}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Geen specifieke vaardigheden.{{/if}}
{{/each}}
{{/if}}

{{#if taskHistory}}
Taakgeschiedenis:
{{#each taskHistory}}
- Toegewezen aan: {{{assignee}}}, Taak: {{{taskDescription}}}, Voltooiingstijd: {{{completionTime}}} uur
{{/each}}
{{else}}
Geen taakgeschiedenis beschikbaar.
{{/if}}

Analyseer de taakomschrijving en de vaardigheden van de beschikbare toewijzers. Geef prioriteit aan de persoon wiens vaardigheden het beste aansluiten bij de taak. Gebruik de taakgeschiedenis als een secundaire factor. Stel op basis hiervan de beste toewijzer voor en leg je redenering beknopt uit.
`, 
});

const suggestTaskAssigneeFlow = ai.defineFlow(
  {
    name: 'suggestTaskAssigneeFlow',
    inputSchema: SuggestTaskAssigneeInputSchema,
    outputSchema: SuggestTaskAssigneeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
