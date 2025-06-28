import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { z } from 'zod';
import { processCommand } from '@/ai/flows/process-command';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';

const commandRequestSchema = z.object({
  command: z.string(),
});

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.split('Bearer ')[1];
    if (!apiKey) {
        return NextResponse.json({ error: 'Unauthorized: API key is missing.' }, { status: 401 });
    }

    const authResult = await authenticateApiKey(apiKey);
    if (!authResult) {
        return NextResponse.json({ error: 'Unauthorized: Invalid API key.' }, { status: 401 });
    }
    
    // For slash commands, we need a general permission to interact with the bot.
    // We check for 'write:tasks' as a baseline permission to execute commands that might create tasks.
    if (!authResult.permissions.includes('write:tasks')) {
        return NextResponse.json({ error: 'Forbidden: Your API key lacks permissions to execute commands.' }, { status: 403 });
    }
    
    const { organizationId, creatorId } = authResult;

    try {
        const body = await request.json();
        const parsedBody = commandRequestSchema.safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ error: 'Bad Request: Invalid payload.', details: parsedBody.error.flatten() }, { status: 400 });
        }

        const { command } = parsedBody.data;

        const userDoc = await getDoc(doc(db, 'users', creatorId));
        if (!userDoc.exists()) {
             return NextResponse.json({ error: 'Internal Server Error: User associated with API key not found.' }, { status: 500 });
        }
        const userName = (userDoc.data() as User).name;

        const result = await processCommand({
            command,
            userId: creatorId,
            organizationId,
            userName,
        });

        return NextResponse.json({ success: true, response: result });

    } catch (error: any) {
        console.error("API Error in command endpoint:", error);
        if (error instanceof SyntaxError) {
             return NextResponse.json({ error: 'Bad Request: Invalid JSON body.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
