
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import crypto from 'crypto';
import type { Organization, Task, GitHubLink } from '@/lib/types';
import { suggestStatusUpdate } from '@/ai/flows/suggest-status-update-flow';
import { createNotification } from '@/app/actions/notification.actions';

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

                const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
                if (!orgDoc.exists()) {
                    console.warn(`Webhook: Organization ${organizationId} not found.`);
                    return NextResponse.json({ success: true, message: 'Webhook processed, but org not found.' });
                }
                const orgData = orgDoc.data() as Organization;
                const availableStatuses = orgData.settings?.customization?.statuses || [];

                for (const taskDoc of snapshot.docs) {
                    const task = taskDoc.data() as Task;
                    try {
                        const suggestion = await suggestStatusUpdate({
                            taskId: task.id,
                            organizationId,
                            currentStatus: task.status,
                            availableStatuses,
                            taskTitle: task.title,
                            event: {
                                type: 'pr_merged',
                                prTitle: pr.title,
                            },
                        });

                        if (suggestion.shouldUpdate && suggestion.newStatus) {
                            await updateDoc(doc(db, 'tasks', task.id), { status: suggestion.newStatus });

                            const recipients = new Set([...task.assigneeIds, task.creatorId]);
                            const notificationMessage = `De status van "${task.title}" is automatisch bijgewerkt naar "${suggestion.newStatus}" na het mergen van een pull request.`;
                            recipients.forEach(recipientId => {
                                if (recipientId) {
                                    createNotification(recipientId, notificationMessage, task.id, organizationId, 'system');
                                }
                            });
                        }
                    } catch(e) {
                         console.error(`Webhook: Failed to process AI suggestion for task ${task.id}`, e);
                    }
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
                        
                        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
                        if (!orgDoc.exists()) continue; 
                        const orgData = orgDoc.data() as Organization;
                        const availableStatuses = orgData.settings?.customization?.statuses || [];

                        for (const taskId of taskIds) {
                            await linkItemToTask(taskId, newLink, organizationId);
                            
                            const taskDoc = await getDoc(doc(db, 'tasks', taskId));
                            if (taskDoc.exists() && taskDoc.data().organizationId === organizationId) {
                                const task = taskDoc.data() as Task;
                                try {
                                    const suggestion = await suggestStatusUpdate({
                                        taskId,
                                        organizationId,
                                        currentStatus: task.status,
                                        availableStatuses,
                                        taskTitle: task.title,
                                        event: {
                                            type: 'commit_pushed',
                                            commitMessage: commit.message,
                                        }
                                    });

                                    if (suggestion.shouldUpdate && suggestion.newStatus) {
                                        const recipients = new Set([...task.assigneeIds, task.creatorId]);
                                        const notificationMessage = `AI stelt voor om de status van "${task.title}" te wijzigen naar "${suggestion.newStatus}" n.a.v. een nieuwe commit.`;
                                        recipients.forEach(recipientId => {
                                            if (recipientId) {
                                                createNotification(recipientId, notificationMessage, taskId, organizationId, 'system');
                                            }
                                        });
                                    }

                                } catch(e) {
                                    console.error(`Webhook: Failed to process AI suggestion for commit on task ${taskId}`, e);
                                }
                            }
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
