
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/core/firebase';
import { updateDoc, deleteDoc } from 'firebase/firestore';
import { withResourceAuth } from '@/lib/api/api-auth-wrapper';
import type { AuthenticatedApiHandlerContext, AuthenticatedApiHandlerAuthResult } from '@/lib/api/api-auth-wrapper';
import { serializeProject } from '@/lib/api/api-serializers';

const getProjectHandler = async (
  request: NextRequest,
  context: AuthenticatedApiHandlerContext,
  authResult: AuthenticatedApiHandlerAuthResult,
  project: any
) => {
  return NextResponse.json(serializeProject(project));
};

const updateProjectHandler = async (
  request: NextRequest,
  context: AuthenticatedApiHandlerContext,
  authResult: AuthenticatedApiHandlerAuthResult,
  project: any
) => {
  try {
    const body = await request.json();

    // Prevent updating critical fields
    delete body.id;
    delete body.organizationId;
    
    await updateDoc(project.ref, body);
    const updatedDoc = { ...project, ...body };
    
    return NextResponse.json(serializeProject(updatedDoc));

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
  authResult: AuthenticatedApiHandlerAuthResult,
  project: any
) => {
  try {
    await deleteDoc(project.ref);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("API Error deleting project:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
};

export const GET = withResourceAuth('projects', 'projectId', getProjectHandler, ['read:projects']);
export const PUT = withResourceAuth('projects', 'projectId', updateProjectHandler, ['write:projects']);
export const DELETE = withResourceAuth('projects', 'projectId', deleteProjectHandler, ['delete:projects']);
