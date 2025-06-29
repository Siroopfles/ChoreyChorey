
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { updateDoc, deleteDoc } from 'firebase/firestore';
import { withResourceAuth } from '@/lib/api-auth-wrapper';
import type { AuthenticatedApiHandlerContext, AuthenticatedApiHandlerAuthResult } from '@/lib/api-auth-wrapper';
import { serializeTeam } from '@/lib/api-serializers';

const getTeamHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult,
    team: any
) => {
    return NextResponse.json(serializeTeam(team));
};


const updateTeamHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult,
    team: any
) => {
    try {
        const body = await request.json();

        // Prevent updating critical fields
        delete body.id;
        delete body.organizationId;
        
        await updateDoc(team.ref, body);
        const updatedDoc = { ...team, ...body };
        
        return NextResponse.json(serializeTeam(updatedDoc));

    } catch (error: any) {
        console.error("API Error updating team:", error);
        if (error instanceof SyntaxError) {
             return NextResponse.json({ error: 'Bad Request: Invalid JSON body.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
};

const deleteTeamHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult,
    team: any
) => {
    try {
        await deleteDoc(team.ref);
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error("API Error deleting team:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
};

export const GET = withResourceAuth('teams', 'teamId', getTeamHandler, ['read:teams']);
export const PUT = withResourceAuth('teams', 'teamId', updateTeamHandler, ['write:teams']);
export const DELETE = withResourceAuth('teams', 'teamId', deleteTeamHandler, ['delete:teams']);
