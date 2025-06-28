import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { addCommentAction } from '@/app/actions/task.actions';

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('orgId');
    const secret = searchParams.get('secret');

    // Basic secret validation to ensure the request is coming from a trusted source
    if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!organizationId) {
        return NextResponse.json({ error: 'Organization ID is required in the webhook URL' }, { status: 400 });
    }

    try {
        const payload = await request.json();
        const eventType = payload.webhookEvent;

        // Handle comment creation event from Jira
        if (eventType === 'comment_created') {
            const issueKey = payload.issue.key;
            const commentBody = payload.comment.body;
            const commentAuthor = payload.comment.author.displayName;
            const jiraCommentUrl = `${payload.issue.self.split('/rest/')[0]}/browse/${issueKey}?focusedCommentId=${payload.comment.id}`;

            // Find the corresponding task in Chorey using the denormalized jiraLinkKeys
            const q = query(
                collection(db, 'tasks'),
                where('organizationId', '==', organizationId),
                where('jiraLinkKeys', 'array-contains', issueKey),
                limit(1)
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const taskDoc = snapshot.docs[0];
                const choreyTaskId = taskDoc.id;
                
                const formattedComment = `
                    <p>
                        <strong>${commentAuthor}</strong> reageerde in Jira:
                        <a href="${jiraCommentUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.8rem; margin-left: 8px;">(Bekijk in Jira)</a>
                    </p>
                    <blockquote>${commentBody.replace(/\n/g, '<br/>')}</blockquote>
                `;

                // Use a system user for comments coming from Jira
                await addCommentAction(choreyTaskId, formattedComment, 'jira-bot', 'Jira Bot', organizationId);
            }
        }
        
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Jira Webhook Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
