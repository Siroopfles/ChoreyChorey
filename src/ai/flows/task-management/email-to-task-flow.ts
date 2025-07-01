'use server';
/**
 * @fileOverview An AI agent that creates a task from an email.
 * - emailToTask - A function that handles the email-to-task process.
 */
import { ai } from '@/ai/genkit';
import { EmailToTaskInputSchema, EmailToTaskOutputSchema } from '@/ai/schemas';
import type { EmailToTaskInput, EmailToTaskOutput } from '@/ai/schemas';
import { createTask } from '@/ai/tools/task-tools';
import { findUserByEmail } from '@/ai/tools/user-tools';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/core/firebase';
import type { Project } from '@/lib/types';

export async function emailToTask(input: EmailToTaskInput): Promise<EmailToTaskOutput> {
  return emailToTaskFlow(input);
}

const emailToTaskFlow = ai.defineFlow(
  {
    name: 'emailToTaskFlow',
    inputSchema: EmailToTaskInputSchema,
    outputSchema: EmailToTaskOutputSchema,
  },
  async (input) => {
    const { from, to, subject, body } = input;

    // 1. Parse the 'to' address to get routing info
    const localPart = to.split('@')[0];
    const parts = localPart.split('-');

    let organizationId: string | undefined;
    let projectId: string | undefined;
    let userId: string | undefined;

    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'o' && parts[i+1]) {
            organizationId = parts[i+1];
        } else if (parts[i] === 'p' && parts[i+1]) {
            projectId = parts[i+1];
        } else if (parts[i] === 'u' && parts[i+1]) {
            userId = parts[i+1];
        }
    }

    if (!organizationId) {
        return "Kon organisatie-ID niet vinden in het 'Aan' adres.";
    }

    // 2. Find the creator by their 'from' email address
    const creator = await findUserByEmail({ email: from, organizationId });
    if (!creator) {
        return `Gebruiker met e-mail ${from} niet gevonden in de organisatie.`;
    }

    // 3. Prepare task data
    const taskData: any = {
      title: subject,
      description: body,
      assigneeIds: userId ? [userId] : [],
      projectId: projectId || null,
    };
    
    // 4. Create the task
    try {
        const result = await createTask({
            organizationId,
            creatorId: creator.id,
            taskData,
        });

        let responseMessage = `Taak '${subject}' succesvol aangemaakt.`;
        if (projectId) {
            const projectDoc = await getDoc(doc(db, 'projects', projectId));
            if (projectDoc.exists()) {
                const projectData = projectDoc.data() as Project;
                responseMessage += ` in project '${projectData.name}'`;
            }
        }
        if (userId) {
             responseMessage += ` en toegewezen.`;
        }

        return responseMessage;
    } catch (error: any) {
        console.error("Error creating task from email:", error);
        return `Fout bij het aanmaken van de taak: ${error.message}`;
    }
  }
);
