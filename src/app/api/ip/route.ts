import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    return NextResponse.json({ ip });
}
