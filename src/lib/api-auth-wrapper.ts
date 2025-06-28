import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import type { ApiPermission } from '@/lib/types';

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
