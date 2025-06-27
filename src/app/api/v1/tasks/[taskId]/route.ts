import { NextResponse, type NextRequest } from 'next/server';
import { getOrgIdFromApiKey } from '@/lib/api-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import type { Task } from '@/lib/types';

// Helper to serialize Firestore Timestamps to ISO strings for JSON response
const serializeTask = (data: any) => {
    const serializedData: any = {};
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            serializedData[key] = (data[key] as Timestamp).toDate().toISOString();
        } else if (data[key] instanceof Date) {
            serializedData[key] = data[key].toISOString();
        } else if(data[key] !== null && typeof data[key] === 'object' && !Array.isArray(data[key])) {
            // Avoid serializing complex objects like history for now
        }
        else {
            serializedData[key] = data[key];
        }
    }
    return serializedData;
};


// GET a single task
export async function GET(request: NextRequest, { params }: { params: { taskId: string } }) {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.split('Bearer ')[1];
    if (!apiKey) {
        return NextResponse.json({ error: 'Unauthorized: API key is missing.' }, { status: 401 });
    }
    const organizationId = await getOrgIdFromApiKey(apiKey);
    if (!organizationId) {
        return NextResponse.json({ error: 'Unauthorized: Invalid API key.' }, { status: 401 });
    }

    try {
        const { taskId } = params;
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
}

// PUT (update) a task
export async function PUT(request: NextRequest, { params }: { params: { taskId: string } }) {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.split('Bearer ')[1];
    if (!apiKey) {
        return NextResponse.json({ error: 'Unauthorized: API key is missing.' }, { status: 401 });
    }
    const organizationId = await getOrgIdFromApiKey(apiKey);
    if (!organizationId) {
        return NextResponse.json({ error: 'Unauthorized: Invalid API key.' }, { status: 401 });
    }
    
    try {
        const { taskId } = params;
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
}

// DELETE a task
export async function DELETE(request: NextRequest, { params }: { params: { taskId: string } }) {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.split('Bearer ')[1];
    if (!apiKey) {
        return NextResponse.json({ error: 'Unauthorized: API key is missing.' }, { status: 401 });
    }
    const organizationId = await getOrgIdFromApiKey(apiKey);
    if (!organizationId) {
        return NextResponse.json({ error: 'Unauthorized: Invalid API key.' }, { status: 401 });
    }

    try {
        const { taskId } = params;
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
}
