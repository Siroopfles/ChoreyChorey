
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { withApiKeyAuth } from '@/lib/api-auth-wrapper';
import type { AuthenticatedApiHandlerContext, AuthenticatedApiHandlerAuthResult } from '@/lib/api-auth-wrapper';
import { serializeUser } from '@/lib/api-serializers';


const getUsersHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult
) => {
    const { organizationId } = authResult;

    try {
        const { searchParams } = request.nextUrl;
        const queryConstraints: any[] = [where('organizationIds', 'array-contains', organizationId)];

        if (searchParams.get('email')) {
            queryConstraints.push(where('email', '==', searchParams.get('email')));
        }

        const usersQuery = query(collection(db, 'users'), ...queryConstraints);
        const snapshot = await getDocs(usersQuery);

        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            return serializeUser({ id: doc.id, ...data });
        });

        return NextResponse.json({ data: users });

    } catch (error: any) {
        console.error("API Error fetching users:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
};


export const GET = withApiKeyAuth(getUsersHandler, ['read:users']);
