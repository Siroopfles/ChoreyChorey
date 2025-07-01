'use server';
/**
 * @fileOverview An AI agent for suggesting project headcount and team composition.
 * - suggestHeadcount - A function that analyzes a project description to suggest headcount.
 */
import fs from 'node:fs';
import path from 'node:path';
import {ai} from '@/ai/genkit';
import { SuggestHeadcountInputSchema, SuggestHeadcountOutputSchema } from '@/ai/schemas';
import type { SuggestHeadcountInput, SuggestHeadcountOutput } from '@/ai/schemas';
import { getDocs, query, collection, where, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/core/firebase';
import { DEFAULT_ROLES, type User, type Organization } from '@/lib/types';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/suggest-headcount.prompt'), 'utf-8');

export async function suggestHeadcount(organizationId: string, projectDescription: string): Promise<SuggestHeadcountOutput> {
    const orgUsersSnapshot = await getDocs(query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId)));
        
    const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
    if (!orgDoc.exists()) {
        throw new Error("Organisatie niet gevonden.");
    }
    const orgData = orgDoc.data() as Organization;
    const orgMembers = orgData.members || {};
    const allRoles = { ...DEFAULT_ROLES, ...(orgData.settings?.customization?.customRoles || {}) };

    const availableUsers = orgUsersSnapshot.docs.map(doc => {
        const userData = doc.data() as User;
        const roleId = orgMembers[doc.id]?.role || 'Member';
        const roleName = allRoles[roleId]?.name || roleId;
        return {
            id: doc.id,
            name: userData.name,
            role: roleName,
            skills: userData.skills || []
        }
    });
  
  return suggestHeadcountFlow({ projectDescription, availableUsers });
}

const prompt = ai.definePrompt({
  name: 'suggestHeadcountPrompt',
  input: {schema: SuggestHeadcountInputSchema},
  output: {schema: SuggestHeadcountOutputSchema},
  model: 'gemini-pro',
  prompt: promptText,
});

const suggestHeadcountFlow = ai.defineFlow(
  {
    name: 'suggestHeadcountFlow',
    inputSchema: SuggestHeadcountInputSchema,
    outputSchema: SuggestHeadcountOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
