
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/core/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { withResourceAuth } from '@/lib/api/api-auth-wrapper';
import type { AuthenticatedApiHandlerContext, AuthenticatedApiHandlerAuthResult } from '@/lib/api/api-auth-wrapper';
import { serializeTask } from '@/lib/api/api-serializers';


const getTaskHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult,
    task: any
) => {
    return NextResponse.json(serializeTask(task));
};

const updateTaskHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult,
    task: any
) => {
    try {
        const body = await request.json();

        // Prevent updating critical fields
        delete body.id;
        delete body.organizationId;
        delete body.creatorId;
        delete body.createdAt;
        delete body.history;

        await updateDoc(task.ref, body);
        const updatedDoc = { ...task, ...body };
        
        return NextResponse.json(serializeTask(updatedDoc));

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
    authResult: AuthenticatedApiHandlerAuthResult,
    task: any
) => {
    try {
        await deleteDoc(task.ref);
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error("API Error deleting task:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
};

export const GET = withResourceAuth('tasks', 'taskId', getTaskHandler, ['read:tasks']);
export const PUT = withResourceAuth('tasks', 'taskId', updateTaskHandler, ['write:tasks']);
export const DELETE = withResourceAuth('tasks', 'taskId', deleteTaskHandler, ['delete:tasks']);
