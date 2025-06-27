import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import type { Status, Task } from '@/lib/types';

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

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.split('Bearer ')[1];
    if (!apiKey) {
        return NextResponse.json({ error: 'Unauthorized: API key is missing.' }, { status: 401 });
    }

    const authResult = await authenticateApiKey(apiKey);
    if (!authResult) {
        return NextResponse.json({ error: 'Unauthorized: Invalid API key.' }, { status: 401 });
    }

    if (!authResult.permissions.includes('read:tasks')) {
        return NextResponse.json({ error: 'Forbidden: Your API key lacks read permissions for tasks.' }, { status: 403 });
    }
    
    const { organizationId } = authResult;

    try {
        const { searchParams } = request.nextUrl;
        const queryConstraints: any[] = [where('organizationId', '==', organizationId)];
        
        if (searchParams.get('status')) {
            queryConstraints.push(where('status', '==', searchParams.get('status')));
        }
        if (searchParams.get('priority')) {
            queryConstraints.push(where('priority', '==', searchParams.get('priority')));
        }
        if (searchParams.get('assigneeId')) {
            queryConstraints.push(where('assigneeIds', 'array-contains', searchParams.get('assigneeId')));
        }
         if (searchParams.get('projectId')) {
            queryConstraints.push(where('projectId', '==', searchParams.get('projectId')));
        }

        const tasksQuery = query(collection(db, 'tasks'), ...queryConstraints);
        const snapshot = await getDocs(tasksQuery);

        const tasks = snapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...serializeTask(data) };
        });

        return NextResponse.json({ data: tasks });

    } catch (error: any) {
        console.error("API Error fetching tasks:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

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

    const { organizationId } = authResult;

    try {
        const body = await request.json();

        if (!body.title) {
            return NextResponse.json({ error: 'Bad Request: title is required.' }, { status: 400 });
        }

        const firestoreTask: Omit<Task, 'id'> = {
            title: body.title,
            description: body.description || '',
            status: body.status || 'Te Doen' as Status,
            priority: body.priority || 'Midden',
            assigneeIds: body.assigneeIds || [],
            creatorId: 'api', // Identify tasks created via API
            organizationId: organizationId,
            createdAt: new Date(),
            dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
            order: Date.now(),
            labels: body.labels || [],
            subtasks: body.subtasks || [],
            attachments: body.attachments || [],
            comments: [],
            history: [{
                id: crypto.randomUUID(),
                userId: 'api',
                timestamp: new Date(),
                action: 'Aangemaakt',
                details: 'via de API',
            }],
            isPrivate: body.isPrivate || false,
            completedAt: null,
            storyPoints: body.storyPoints || null,
            isSensitive: body.isSensitive || false,
            helpNeeded: body.helpNeeded || false,
            imageDataUri: null,
            thanked: false,
            timeLogged: 0,
            activeTimerStartedAt: null,
            rating: null,
            reviewerId: body.reviewerId || null,
            consultedUserIds: body.consultedUserIds || [],
            informedUserIds: body.informedUserIds || [],
            projectId: body.projectId || null,
            blockedBy: body.blockedBy || [],
            dependencyConfig: body.dependencyConfig || {},
            recurring: body.recurring || null,
            isChoreOfTheWeek: false,
        };

        const docRef = await addDoc(collection(db, 'tasks'), firestoreTask);

        const createdTask = {
            id: docRef.id,
            ...firestoreTask,
        };
        
        return NextResponse.json(serializeTask(createdTask), { status: 201 });

    } catch (error: any) {
        console.error("API Error creating task:", error);
        if (error instanceof SyntaxError) {
             return NextResponse.json({ error: 'Bad Request: Invalid JSON body.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
