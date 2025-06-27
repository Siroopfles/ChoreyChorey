import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

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
    
    if (!authResult.permissions.includes('read:users')) {
        return NextResponse.json({ error: 'Forbidden: Your API key lacks read permissions for users.' }, { status: 403 });
    }

    const { organizationId } = authResult;

    try {
        const usersQuery = query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId));
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
}
