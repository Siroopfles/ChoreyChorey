'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { updateTaskAction } from '@/app/actions/task.actions';
import crypto from 'crypto';

async function verifySignature(request: NextRequest): Promise<{ isValid: boolean; body?: any }> {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    if (!signature) {
      console.warn('GitHub webhook: Missing signature header.');
      return { isValid: false };
    }
    
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      console.error('GitHub webhook: GITHUB_WEBHOOK_SECRET is not set in environment variables.');
      return { isValid: false }; 
    }

    const bodyText = await request.text();
    const hmac = crypto.createHmac('sha256', secret);
    const digest = `sha256=${hmac.update(bodyText).digest('hex')}`;
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      console.warn('GitHub webhook: Invalid signature.');
      return { isValid: false };
    }

    return { isValid: true, body: JSON.parse(bodyText) };
  } catch (error) {
    console.error("Error verifying GitHub webhook signature:", error);
    return { isValid: false };
  }
}

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('orgId');

    if (!organizationId) {
        return NextResponse.json({ error: 'Bad Request: orgId query parameter is required.' }, { status: 400 });
    }

    const { isValid, body } = await verifySignature(request);
    if (!isValid) {
        return NextResponse.json({ error: 'Unauthorized: Invalid signature.' }, { status: 401 });
    }

    const event = request.headers.get('x-github-event');
    if (event !== 'pull_request') {
        return NextResponse.json({ message: 'Event ignored: not a pull request.' }, { status: 200 });
    }
    
    try {
        const payload = body;
        
        if (payload.action === 'closed' && payload.pull_request.merged === true) {
            const prUrl = payload.pull_request.html_url;
            
            const q = query(
                collection(db, 'tasks'),
                where('organizationId', '==', organizationId),
                where('githubLinkUrls', 'array-contains', prUrl),
                limit(1)
            );
            
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const taskDoc = snapshot.docs[0];
                const taskId = taskDoc.id;
                
                console.log(`GitHub webhook: Found task ${taskId} for merged PR ${prUrl}. Updating status to 'Voltooid'.`);

                const systemUserId = 'github-bot';
                
                await updateTaskAction(taskId, { status: 'Voltooid' }, systemUserId, organizationId);

            } else {
                 console.log(`GitHub webhook: No task found in org ${organizationId} for merged PR ${prUrl}.`);
            }
        }
        
        return NextResponse.json({ success: true, message: 'Webhook processed.' });

    } catch (error: any) {
        console.error("GitHub Webhook Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
