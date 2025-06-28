
import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { z } from 'zod';
import { createTask, findUserByEmail } from '@/ai/tools/task-tools';

const ingressTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(['Laag', 'Midden', 'Hoog', 'Urgent']).optional(),
  assigneeEmail: z.string().email().optional(),
  projectId: z.string().optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
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

    if (!authResult.permissions.includes('write:tasks')) {
        return NextResponse.json({ error: 'Forbidden: Your API key lacks write permissions for tasks.' }, { status: 403 });
    }
    
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

        const taskData = {
            title,
            description,
            priority,
            assigneeIds,
            projectId,
            labels,
            dueDate,
        };
        
        // Remove undefined keys so the createTask tool doesn't process them
        Object.keys(taskData).forEach(key => (taskData as any)[key] === undefined && delete (taskData as any)[key]);
        
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
}
