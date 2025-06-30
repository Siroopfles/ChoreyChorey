
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import { withApiKeyAuth } from '@/lib/api-auth-wrapper';
import type { AuthenticatedApiHandlerContext, AuthenticatedApiHandlerAuthResult } from '@/lib/api-auth-wrapper';
import { serializeProject } from '@/lib/api-serializers';


const getProjectsHandler = async (
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
    
    const projectsQuery = query(collection(db, 'projects'), ...queryConstraints);
    const snapshot = await getDocs(projectsQuery);

    const projects = snapshot.docs.map(doc => serializeProject({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ data: projects });

  } catch (error: any) {
    console.error("API Error fetching projects:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
};

const createProjectHandler = async (
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

    const newProject: Omit<Project, 'id'> = {
      name: body.name,
      organizationId,
      program: body.program || '',
      teamIds: body.teamIds || [],
      isSensitive: body.isSensitive || false,
      isPublic: body.isPublic || false,
      budget: body.budget,
      budgetType: body.budgetType,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
    };

    const docRef = await addDoc(collection(db, 'projects'), newProject);
    
    return NextResponse.json({ id: docRef.id, ...newProject }, { status: 201 });

  } catch (error: any) {
    console.error("API Error creating project:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Bad Request: Invalid JSON body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
};

export const GET = withApiKeyAuth(getProjectsHandler, ['read:projects']);
export const POST = withApiKeyAuth(createProjectHandler, ['write:projects']);
