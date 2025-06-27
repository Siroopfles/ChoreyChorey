import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';

const serializeUser = (data: any) => {
    // Return a public-safe user object
    return {
        id: data.id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        points: data.points || 0,
        skills: data.skills || [],
        status: data.status || { type: 'Offline', until: null },
    };
};

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.split('Bearer ')[1];
    if (!apiKey) {
        return NextResponse.json({ error: 'Unauthorized: API key is missing.' }, { status: 401 });
    }

    const authResult = await authenticateApiKey(apiKey);
    if (!authResult) {
        return NextResponse.json({ error: 'Unauthorized: Invalid API key.' }, { status: 401 });
    }
    
    if (!authResult.permissions.includes('read:users')) {
        return NextResponse.json({ error: 'Forbidden: Your API key lacks read permissions for users.' }, { status: 403 });
    }

    const { organizationId } = authResult;

    try {
        const { userId } = params;
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
}
