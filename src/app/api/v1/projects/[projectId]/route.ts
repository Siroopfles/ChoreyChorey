import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import { withApiKeyAuth } from '@/lib/api-auth-wrapper';
import type { AuthenticatedApiHandlerContext, AuthenticatedApiHandlerAuthResult } from '@/lib/api-auth-wrapper';

const getProjectHandler = async (
  request: NextRequest,
  context: AuthenticatedApiHandlerContext,
  authResult: AuthenticatedApiHandlerAuthResult
) => {
  const { organizationId } = authResult;
  const { projectId } = context.params;

  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const projectData = projectDoc.data() as Project;
    if (projectData.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden: Project not in your organization.' }, { status: 403 });
    }

    return NextResponse.json({ id: projectDoc.id, ...projectData });

  } catch (error: any) {
    console.error("API Error fetching project:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
};

const updateProjectHandler = async (
  request: NextRequest,
  context: AuthenticatedApiHandlerContext,
  authResult: AuthenticatedApiHandlerAuthResult
) => {
  const { organizationId } = authResult;
  const { projectId } = context.params;

  try {
    const body = await request.json();

    // Prevent updating critical fields
    delete body.id;
    delete body.organizationId;
    
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    if (projectDoc.data().organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await updateDoc(projectRef, body);
    const updatedDoc = await getDoc(projectRef);
    
    return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });

  } catch (error: any) {
    console.error("API Error updating project:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Bad Request: Invalid JSON body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
};

const deleteProjectHandler = async (
  request: NextRequest,
  context: AuthenticatedApiHandlerContext,
  authResult: AuthenticatedApiHandlerAuthResult
) => {
  const { organizationId } = authResult;
  const { projectId } = context.params;
  
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    if (projectDoc.data().organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteDoc(projectRef);

    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error("API Error deleting project:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
};

export const GET = withApiKeyAuth(getProjectHandler, ['read:projects']);
export const PUT = withApiKeyAuth(updateProjectHandler, ['write:projects']);
export const DELETE = withApiKeyAuth(deleteProjectHandler, ['delete:projects']);
