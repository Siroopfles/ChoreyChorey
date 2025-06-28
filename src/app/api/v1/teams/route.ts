import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import type { Team } from '@/lib/types';
import { withApiKeyAuth } from '@/lib/api-auth-wrapper';
import type { AuthenticatedApiHandlerContext, AuthenticatedApiHandlerAuthResult } from '@/lib/api-auth-wrapper';

const getTeamsHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult
) => {
    const { organizationId } = authResult;

    try {
        const { searchParams } = request.nextUrl;
        const queryConstraints: any[] = [where('organizationId', '==', organizationId)];

        if (searchParams.get('name')) {
            queryConstraints.push(where('name', '==', searchParams.get('name')));
        }

        const teamsQuery = query(collection(db, 'teams'), ...queryConstraints);
        const snapshot = await getDocs(teamsQuery);

        const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ data: teams });

    } catch (error: any) {
        console.error("API Error fetching teams:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
};

const createTeamHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult
) => {
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
};

export const GET = withApiKeyAuth(getTeamsHandler, ['read:teams']);
export const POST = withApiKeyAuth(createTeamHandler, ['write:teams']);
