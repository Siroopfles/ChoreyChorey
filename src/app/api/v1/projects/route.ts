import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import type { Project } from '@/lib/types';

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
    
    if (!authResult.permissions.includes('read:projects')) {
        return NextResponse.json({ error: 'Forbidden: Your API key lacks read permissions for projects.' }, { status: 403 });
    }

    const { organizationId } = authResult;

    try {
        const projectsQuery = query(collection(db, 'projects'), where('organizationId', '==', organizationId));
        const snapshot = await getDocs(projectsQuery);

        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ data: projects });

    } catch (error: any) {
        console.error("API Error fetching projects:", error);
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

    if (!authResult.permissions.includes('write:projects')) {
        return NextResponse.json({ error: 'Forbidden: Your API key lacks write permissions for projects.' }, { status: 403 });
    }

    const { organizationId } = authResult;

    try {
        const body = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: 'Bad Request: name is required.' }, { status: 400 });
        }

        const newProject: Omit<Project, 'id'> = {
            name: body.name,
            organizationId,
            program: body.program || '',
            teamIds: body.teamIds || [],
            isSensitive: body.isSensitive || false,
            isPublic: body.isPublic || false,
        };

        const docRef = await addDoc(collection(db, 'projects'), newProject);
        
        return NextResponse.json({ id: docRef.id, ...newProject }, { status: 201 });

    } catch (error: any) {
        console.error("API Error creating project:", error);
        if (error instanceof SyntaxError) {
             return NextResponse.json({ error: 'Bad Request: Invalid JSON body.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
