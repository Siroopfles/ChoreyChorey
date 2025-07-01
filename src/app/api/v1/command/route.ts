
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { processCommand } from '@/ai/flows/core-utility/process-command';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/core/firebase';
import type { User } from '@/lib/types';
import { withApiKeyAuth } from '@/lib/api/api-auth-wrapper';
import type { AuthenticatedApiHandlerContext, AuthenticatedApiHandlerAuthResult } from '@/lib/api/api-auth-wrapper';

const commandRequestSchema = z.object({
  command: z.string(),
});

const commandHandler = async (
  request: NextRequest,
  context: AuthenticatedApiHandlerContext,
  authResult: AuthenticatedApiHandlerAuthResult
) => {
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
};

// We check for 'write:tasks' as a baseline permission to execute commands that might create tasks.
export const POST = withApiKeyAuth(commandHandler, ['write:tasks']);
