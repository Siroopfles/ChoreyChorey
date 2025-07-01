
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createTask, findUserByEmail } from '@/ai/tools/task-tools';
import { withApiKeyAuth } from '@/lib/api/api-auth-wrapper';
import type { AuthenticatedApiHandlerContext, AuthenticatedApiHandlerAuthResult } from '@/lib/api/api-auth-wrapper';

const ingressTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(['Laag', 'Midden', 'Hoog', 'Urgent']).optional(),
  assigneeEmail: z.string().email().optional(),
  projectId: z.string().optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
});

const ingressHandler = async (
  request: NextRequest,
  context: AuthenticatedApiHandlerContext,
  authResult: AuthenticatedApiHandlerAuthResult
) => {
  const { organizationId, creatorId } = authResult;

  try {
    const body = await request.json();
    const parsedBody = ingressTaskSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Bad Request: Invalid payload.', details: parsedBody.error.flatten() }, { status: 400 });
    }

    const { title, description, priority, assigneeEmail, projectId, labels, dueDate } = parsedBody.data;

    let assigneeIds: string[] = [];
    if (assigneeEmail) {
      const user = await findUserByEmail({ email: assigneeEmail, organizationId });
      if (user) {
        assigneeIds.push(user.id);
      } else {
        console.warn(`Ingress: Assignee with email ${assigneeEmail} not found in org ${organizationId}.`);
      }
    }

    const taskData: any = {
      title,
      description,
      priority,
      assigneeIds,
      projectId,
      labels,
      dueDate,
    };

    // Remove undefined keys so the createTask tool doesn't process them
    Object.keys(taskData).forEach(key => taskData[key] === undefined && delete taskData[key]);

    const result = await createTask({
      organizationId,
      creatorId,
      taskData,
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });

  } catch (error: any) {
    console.error("API Error in ingress:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Bad Request: Invalid JSON body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
};

export const POST = withApiKeyAuth(ingressHandler, ['write:tasks']);
