
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import type { Status, Task } from '@/lib/types';
import { withApiKeyAuth } from '@/lib/api-auth-wrapper';
import type { AuthenticatedApiHandlerContext, AuthenticatedApiHandlerAuthResult } from '@/lib/api-auth-wrapper';
import { serializeTask } from '@/lib/api-serializers';
import { addHistoryEntry } from '@/lib/history-utils';


const getTasksHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult
) => {
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
};

const createTaskHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult
) => {
    const { organizationId, creatorId } = authResult;

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
            creatorId: creatorId,
            organizationId: organizationId,
            createdAt: new Date(),
            dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
            order: Date.now(),
            labels: body.labels || [],
            subtasks: body.subtasks || [],
            attachments: body.attachments || [],
            comments: [],
            history: [addHistoryEntry(creatorId, 'Aangemaakt', 'via de API')],
            isPrivate: body.isPrivate || false,
            completedAt: null,
            storyPoints: body.storyPoints || null,
            isSensitive: body.isSensitive || false,
            helpNeeded: body.helpNeeded || false,
            imageUrl: null,
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
};

export const GET = withApiKeyAuth(getTasksHandler, ['read:tasks']);
export const POST = withApiKeyAuth(createTaskHandler, ['write:tasks']);
