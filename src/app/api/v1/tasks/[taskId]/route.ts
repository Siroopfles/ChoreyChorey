import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Task } from '@/lib/types';
import { withApiKeyAuth } from '@/lib/api-auth-wrapper';
import type { AuthenticatedApiHandlerContext, AuthenticatedApiHandlerAuthResult } from '@/lib/api-auth-wrapper';
import { serializeTask } from '@/lib/api-serializers';


const getTaskHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult
) => {
    const { organizationId } = authResult;
    const { taskId } = context.params;

    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        const taskData = taskDoc.data() as Task;

        if (taskData.organizationId !== organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ id: taskDoc.id, ...serializeTask(taskData) });

    } catch (error: any) {
        console.error("API Error fetching task:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
};

const updateTaskHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult
) => {
    const { organizationId } = authResult;
    const { taskId } = context.params;

    try {
        const body = await request.json();

        // Prevent updating critical fields
        delete body.id;
        delete body.organizationId;
        delete body.creatorId;
        delete body.createdAt;
        delete body.history;

        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }
        if (taskDoc.data().organizationId !== organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await updateDoc(taskRef, body);

        const updatedDoc = await getDoc(taskRef);
        
        return NextResponse.json({ id: updatedDoc.id, ...serializeTask(updatedDoc.data()) });

    } catch (error: any) {
        console.error("API Error updating task:", error);
        if (error instanceof SyntaxError) {
             return NextResponse.json({ error: 'Bad Request: Invalid JSON body.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
};

const deleteTaskHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult
) => {
    const { organizationId } = authResult;
    const { taskId } = context.params;

    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }
        if (taskDoc.data().organizationId !== organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await deleteDoc(taskRef);

        return new NextResponse(null, { status: 204 });

    } catch (error: any) {
        console.error("API Error deleting task:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
};

export const GET = withApiKeyAuth(getTaskHandler, ['read:tasks']);
export const PUT = withApiKeyAuth(updateTaskHandler, ['write:tasks']);
export const DELETE = withApiKeyAuth(deleteTaskHandler, ['delete:tasks']);
