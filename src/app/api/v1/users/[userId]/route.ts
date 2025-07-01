
import { NextResponse, type NextRequest } from 'next/server';
import { withResourceAuth } from '@/lib/api/api-auth-wrapper';
import type { AuthenticatedApiHandlerContext, AuthenticatedApiHandlerAuthResult } from '@/lib/api/api-auth-wrapper';
import { serializeUser } from '@/lib/api/api-serializers';


const getUserHandler = async (
    request: NextRequest,
    context: AuthenticatedApiHandlerContext,
    authResult: AuthenticatedApiHandlerAuthResult,
    user: any
) => {
    return NextResponse.json(serializeUser(user));
};

export const GET = withResourceAuth('users', 'userId', getUserHandler, ['read:users']);
