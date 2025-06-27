import { NextResponse, type NextRequest } from 'next/server';
import { getOrgIdFromApiKey } from '@/lib/api-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.split('Bearer ')[1];

    if (!apiKey) {
        return NextResponse.json({ error: 'Unauthorized: API key is missing.' }, { status: 401 });
    }

    const organizationId = await getOrgIdFromApiKey(apiKey);

    if (!organizationId) {
        return NextResponse.json({ error: 'Unauthorized: Invalid API key.' }, { status: 401 });
    }

    try {
        const tasksQuery = query(collection(db, 'tasks'), where('organizationId', '==', organizationId));
        const snapshot = await getDocs(tasksQuery);

        const tasks = snapshot.docs.map(doc => {
            const data = doc.data();
            // Simple serialization, can be improved to match Task type exactly
            const serializedData: any = {};
            for (const key in data) {
                if (data[key] instanceof Timestamp) {
                    serializedData[key] = (data[key] as Timestamp).toDate().toISOString();
                } else if(data[key] !== null && typeof data[key] === 'object' && !Array.isArray(data[key])) {
                    // Avoid serializing complex objects for now
                }
                else {
                    serializedData[key] = data[key];
                }
            }
            return { id: doc.id, ...serializedData };
        });

        return NextResponse.json({ data: tasks });

    } catch (error: any) {
        console.error("API Error fetching tasks:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
