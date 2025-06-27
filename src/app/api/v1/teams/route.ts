import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import type { Team } from '@/lib/types';

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
    
    if (!authResult.permissions.includes('read:teams')) {
        return NextResponse.json({ error: 'Forbidden: Your API key lacks read permissions for teams.' }, { status: 403 });
    }

    const { organizationId } = authResult;

    try {
        const teamsQuery = query(collection(db, 'teams'), where('organizationId', '==', organizationId));
        const snapshot = await getDocs(teamsQuery);

        const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ data: teams });

    } catch (error: any) {
        console.error("API Error fetching teams:", error);
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

    if (!authResult.permissions.includes('write:teams')) {
        return NextResponse.json({ error: 'Forbidden: Your API key lacks write permissions for teams.' }, { status: 403 });
    }

    const { organizationId } = authResult;

    try {
        const body = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: 'Bad Request: name is required.' }, { status: 400 });
        }

        const newTeam: Omit<Team, 'id'> = {
            name: body.name,
            organizationId,
            memberIds: body.memberIds || [],
        };

        const docRef = await addDoc(collection(db, 'teams'), newTeam);
        
        return NextResponse.json({ id: docRef.id, ...newTeam }, { status: 201 });

    } catch (error: any) {
        console.error("API Error creating team:", error);
        if (error instanceof SyntaxError) {
             return NextResponse.json({ error: 'Bad Request: Invalid JSON body.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
