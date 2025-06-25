import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-task-assignee.ts';
import '@/ai/flows/suggest-subtasks.ts';
import '@/ai/flows/process-command.ts';
import '@/ai/flows/summarize-comments.ts';
import '@/ai/flows/suggest-story-points.ts';
