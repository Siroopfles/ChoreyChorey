import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Project } from '@/lib/types';

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
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
        const { projectId } = params;
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        const projectData = projectDoc.data() as Project;
        if (projectData.organizationId !== organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ id: projectDoc.id, ...projectData });

    } catch (error: any) {
        console.error("API Error fetching project:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { projectId: string } }) {
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
        const { projectId } = params;
        const body = await request.json();

        // Prevent updating critical fields
        delete body.id;
        delete body.organizationId;
        
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }
        if (projectDoc.data().organizationId !== organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await updateDoc(projectRef, body);
        const updatedDoc = await getDoc(projectRef);
        
        return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });

    } catch (error: any) {
        console.error("API Error updating project:", error);
        if (error instanceof SyntaxError) {
             return NextResponse.json({ error: 'Bad Request: Invalid JSON body.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { projectId: string } }) {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.split('Bearer ')[1];
    if (!apiKey) {
        return NextResponse.json({ error: 'Unauthorized: API key is missing.' }, { status: 401 });
    }
    
    const authResult = await authenticateApiKey(apiKey);
    if (!authResult) {
        return NextResponse.json({ error: 'Unauthorized: Invalid API key.' }, { status: 401 });
    }

    if (!authResult.permissions.includes('delete:projects')) {
        return NextResponse.json({ error: 'Forbidden: Your API key lacks delete permissions for projects.' }, { status: 403 });
    }
    
    const { organizationId } = authResult;

    try {
        const { projectId } = params;
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }
        if (projectDoc.data().organizationId !== organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await deleteDoc(projectRef);

        return new NextResponse(null, { status: 204 });

    } catch (error: any) {
        console.error("API Error deleting project:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
