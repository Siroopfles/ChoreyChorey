
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { emailToTask } from '@/ai/flows/email-to-task-flow';
import { env } from '@/lib/env';

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Basic secret validation to ensure the request is coming from a trusted source
    if (!env.WEBHOOK_SECRET || secret !== env.WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const from = formData.get('sender') as string;
        const to = formData.get('recipient') as string;
        const subject = formData.get('subject') as string;
        const body = formData.get('body-plain') as string;

        if (!from || !to || !subject || !body) {
            return NextResponse.json({ error: 'Missing required fields (sender, recipient, subject, body-plain)' }, { status: 400 });
        }

        const result = await emailToTask({ from, to, subject, body });

        // Mailgun expects a 200 OK response to know the webhook was successful.
        return NextResponse.json({ success: true, message: result });

    } catch (error: any) {
        console.error("Mailgun Webhook Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
