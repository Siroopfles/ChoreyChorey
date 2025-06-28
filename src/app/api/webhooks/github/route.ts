
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import crypto from 'crypto';
import type { Organization, Task, GitHubLink } from '@/lib/types';
import { getGithubItemDetailsFromUrl } from '@/lib/github-service';

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

// Helper function to extract task IDs (e.g., "CHR-firestoreid") from text
function findTaskIds(text: string): string[] {
    const regex = /(?:[Ff]ixes|[Rr]esolves|[Cc]loses)?:?\s*#?(CHR-([a-zA-Z0-9]{20}))/g;
    const matches = [...text.matchAll(regex)];
    // Group 2 contains the actual Firestore ID without the "CHR-" prefix
    return matches.map(match => match[2]); 
}

// Generic helper to link a GitHub item (PR or commit) to a Chorey task
async function linkItemToTask(taskId: string, newItem: GitHubLink, organizationId: string) {
    const taskRef = doc(db, 'tasks', taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists() || taskDoc.data().organizationId !== organizationId) {
        console.log(`Webhook: Task ${taskId} not found or does not belong to org ${organizationId}.`);
        return;
    }

    if (taskDoc.data().githubLinkUrls?.includes(newItem.url)) {
        console.log(`Webhook: Task ${taskId} is already linked to ${newItem.url}.`);
        return;
    }
    
    await updateDoc(taskRef, {
        githubLinks: arrayUnion(newItem),
        githubLinkUrls: arrayUnion(newItem.url)
    });

    console.log(`Webhook: Successfully linked ${newItem.type} ${newItem.url} to task ${taskId}.`);
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
    
    try {
        const payload = body;
        
        if (event === 'pull_request') {
            const pr = payload.pull_request;
            
            // Logic for when a PR is merged
            if (payload.action === 'closed' && pr.merged === true) {
                const q = query(
                    collection(db, 'tasks'),
                    where('organizationId', '==', organizationId),
                    where('githubLinkUrls', 'array-contains', pr.html_url)
                );
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const batch = writeBatch(db);
                    snapshot.forEach(taskDoc => {
                        console.log(`Webhook: Found task ${taskDoc.id} for merged PR ${pr.html_url}. Updating status to 'Voltooid'.`);
                        batch.update(taskDoc.ref, { status: 'Voltooid' });
                    });
                    await batch.commit();
                }
            } 
            // Logic for when a PR is opened
            else if (payload.action === 'opened') {
                const textToSearch = `${pr.title} ${pr.body || ''}`;
                const taskIds = findTaskIds(textToSearch);
                const newLink: GitHubLink = {
                    url: pr.html_url,
                    number: pr.number,
                    title: pr.title,
                    state: pr.state,
                    type: 'pull-request'
                };
                for (const taskId of taskIds) {
                    await linkItemToTask(taskId, newLink, organizationId);
                }
            }

        } else if (event === 'push') {
             for (const commit of payload.commits) {
                if (commit.distinct) { // Only process distinct commits to avoid duplicates on rebase etc.
                    const taskIds = findTaskIds(commit.message);
                    if (taskIds.length > 0) {
                        const newLink: GitHubLink = {
                            url: commit.url,
                            number: 0, // N/A for commits
                            title: commit.message.split('\n')[0],
                            state: 'closed',
                            type: 'commit'
                        };
                        for (const taskId of taskIds) {
                            await linkItemToTask(taskId, newLink, organizationId);
                        }
                    }
                }
            }
        }
        
        return NextResponse.json({ success: true, message: 'Webhook processed.' });

    } catch (error: any) {
        console.error("GitHub Webhook Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
