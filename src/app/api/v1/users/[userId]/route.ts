import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { withApiKeyAuth } from '@/lib/api-auth-wrapper';
import type { AuthenticatedApiHandlerContext, AuthenticatedApiHandlerAuthResult } from '@/lib/api-auth-wrapper';
import { serializeUser } from '@/lib/api-serializers';


const getUserHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult
) => {
    const { organizationId } = authResult;
    const { userId } = context.params;

    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        const userData = userDoc.data() as User;

        if (!userData.organizationIds?.includes(organizationId)) {
            return NextResponse.json({ error: 'Forbidden: User is not a member of this organization.' }, { status: 403 });
        }

        return NextResponse.json(serializeUser({ id: userDoc.id, ...userData }));

    } catch (error: any) {
        console.error("API Error fetching user:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
};

export const GET = withApiKeyAuth(getUserHandler, ['read:users']);
