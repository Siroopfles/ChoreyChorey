import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Team } from '@/lib/types';

export async function GET(request: NextRequest, { params }: { params: { teamId: string } }) {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.split('Bearer ')[1];
    if (!apiKey) {
        return NextResponse.json({ error: 'Unauthorized: API key is missing.' }, { status: 401 });
    }

    const authResult = await authenticateApiKey(apiKey);
    if (!authResult) {
        return NextResponse.json({ error: 'Unauthorized: Invalid API key.' }, { status: 401 });
    }
    
    if (!authResult.permissions.includes('read:teams')) {
        return NextResponse.json({ error: 'Forbidden: Your API key lacks read permissions for teams.' }, { status: 403 });
    }

    const { organizationId } = authResult;

    try {
        const { teamId } = params;
        const teamRef = doc(db, 'teams', teamId);
        const teamDoc = await getDoc(teamRef);

        if (!teamDoc.exists()) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        const teamData = teamDoc.data() as Team;
        if (teamData.organizationId !== organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ id: teamDoc.id, ...teamData });

    } catch (error: any) {
        console.error("API Error fetching team:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { teamId: string } }) {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.split('Bearer ')[1];
    if (!apiKey) {
        return NextResponse.json({ error: 'Unauthorized: API key is missing.' }, { status: 401 });
    }

    const authResult = await authenticateApiKey(apiKey);
    if (!authResult) {
        return NextResponse.json({ error: 'Unauthorized: Invalid API key.' }, { status: 401 });
    }

    if (!authResult.permissions.includes('write:teams')) {
        return NextResponse.json({ error: 'Forbidden: Your API key lacks write permissions for teams.' }, { status: 403 });
    }

    const { organizationId } = authResult;
    
    try {
        const { teamId } = params;
        const body = await request.json();

        // Prevent updating critical fields
        delete body.id;
        delete body.organizationId;
        
        const teamRef = doc(db, 'teams', teamId);
        const teamDoc = await getDoc(teamRef);

        if (!teamDoc.exists()) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }
        if (teamDoc.data().organizationId !== organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await updateDoc(teamRef, body);
        const updatedDoc = await getDoc(teamRef);
        
        return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });

    } catch (error: any) {
        console.error("API Error updating team:", error);
        if (error instanceof SyntaxError) {
             return NextResponse.json({ error: 'Bad Request: Invalid JSON body.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { teamId: string } }) {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.split('Bearer ')[1];
    if (!apiKey) {
        return NextResponse.json({ error: 'Unauthorized: API key is missing.' }, { status: 401 });
    }
    
    const authResult = await authenticateApiKey(apiKey);
    if (!authResult) {
        return NextResponse.json({ error: 'Unauthorized: Invalid API key.' }, { status: 401 });
    }

    if (!authResult.permissions.includes('delete:teams')) {
        return NextResponse.json({ error: 'Forbidden: Your API key lacks delete permissions for teams.' }, { status: 403 });
    }
    
    const { organizationId } = authResult;

    try {
        const { teamId } = params;
        const teamRef = doc(db, 'teams', teamId);
        const teamDoc = await getDoc(teamRef);

        if (!teamDoc.exists()) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }
        if (teamDoc.data().organizationId !== organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await deleteDoc(teamRef);

        return new NextResponse(null, { status: 204 });

    } catch (error: any) {
        console.error("API Error deleting team:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
