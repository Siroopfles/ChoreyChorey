
import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import type { ApiPermission } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export type AuthenticatedApiHandlerContext = {
    params: any;
};

export type AuthenticatedApiHandlerAuthResult = {
    organizationId: string;
    permissions: ApiPermission[];
    creatorId: string;
};

type AuthenticatedApiHandler = (
  request: NextRequest,
  context: AuthenticatedApiHandlerContext,
  authResult: AuthenticatedApiHandlerAuthResult
) => Promise<NextResponse>;

type ResourceAuthenticatedApiHandler = (
  request: NextRequest,
  context: AuthenticatedApiHandlerContext,
  authResult: AuthenticatedApiHandlerAuthResult,
  resource: any 
) => Promise<NextResponse>;


/**
 * A higher-order function to wrap API route handlers with API key authentication and permission checks.
 * @param handler The core API route handler logic.
 * @param requiredPermissions An array of permissions required to access this endpoint.
 * @returns A Next.js API route handler.
 */
export function withApiKeyAuth(
  handler: AuthenticatedApiHandler,
  requiredPermissions: ApiPermission[] = []
) {
  return async (request: NextRequest, context: { params: any }): Promise<NextResponse> => {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.split('Bearer ')[1];
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized: API key is missing.' }, { status: 401 });
    }

    const authResult = await authenticateApiKey(apiKey);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key.' }, { status: 401 });
    }

    const hasAllPermissions = requiredPermissions.every(p => authResult.permissions.includes(p));
    if (!hasAllPermissions) {
        return NextResponse.json({ error: 'Forbidden: Your API key lacks the required permissions.' }, { status: 403 });
    }

    return handler(request, context, authResult);
  };
}


/**
 * A higher-order function that builds on withApiKeyAuth to also fetch, validate,
 * and provide a specific Firestore resource to the handler.
 * @param collectionName The name of the Firestore collection for the resource.
 * @param paramName The name of the route parameter containing the document ID.
 * @param handler The core API route handler that receives the fetched resource.
 * @param requiredPermissions An array of permissions required to access this endpoint.
 * @returns A Next.js API route handler.
 */
export function withResourceAuth(
  collectionName: string,
  paramName: string,
  handler: ResourceAuthenticatedApiHandler,
  requiredPermissions: ApiPermission[] = []
) {
    const mainHandler: AuthenticatedApiHandler = async (request, context, authResult) => {
        const resourceId = context.params[paramName];
        if (!resourceId) {
            return NextResponse.json({ error: `Bad Request: Missing parameter '${paramName}'.` }, { status: 400 });
        }

        try {
            const resourceRef = doc(db, collectionName, resourceId);
            const resourceDoc = await getDoc(resourceRef);

            if (!resourceDoc.exists()) {
                return NextResponse.json({ error: 'Not Found' }, { status: 404 });
            }

            const resourceData = resourceDoc.data();
            
            // Handle different ownership validation logic
            const isUserCollection = collectionName === 'users';
            const belongsToOrg = isUserCollection
                ? resourceData.organizationIds?.includes(authResult.organizationId)
                : resourceData.organizationId === authResult.organizationId;
            
            if (!belongsToOrg) {
                 return NextResponse.json({ error: `Forbidden: Resource not in your organization.` }, { status: 403 });
            }

            const resourceWithId = { id: resourceDoc.id, ...resourceData };
            return handler(request, context, authResult, resourceWithId);

        } catch (error: any) {
            console.error(`API Error fetching resource from ${collectionName}:`, error);
            return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
        }
    };
    
    return withApiKeyAuth(mainHandler, requiredPermissions);
}
