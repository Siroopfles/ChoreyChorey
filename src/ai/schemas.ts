import { z } from 'genkit';

// From suggest-story-points.ts
export const SuggestStoryPointsInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().optional().describe('The description of the task.'),
});
export type SuggestStoryPointsInput = z.infer<typeof SuggestStoryPointsInputSchema>;

export const SuggestStoryPointsOutputSchema = z.object({
  points: z.number().describe('The suggested story points, following a modified Fibonacci sequence (1, 2, 3, 5, 8, 13).'),
  reasoning: z.string().describe('A brief explanation for the suggested point value.'),
});
export type SuggestStoryPointsOutput = z.infer<typeof SuggestStoryPointsOutputSchema>;

// From summarize-comments.ts
export const SummarizeCommentsInputSchema = z.object({
  comments: z.array(z.string()).describe('A list of comments from a task thread.'),
});
export type SummarizeCommentsInput = z.infer<typeof SummarizeCommentsInputSchema>;

export const SummarizeCommentsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the key points and decisions from the comments.'),
});
export type SummarizeCommentsOutput = z.infer<typeof SummarizeCommentsOutputSchema>;

// From suggest-subtasks.ts
export const SuggestSubtasksInputSchema = z.object({
  title: z.string().describe('The title of the main task.'),
  description: z.string().optional().describe('The description of the main task.'),
});
export type SuggestSubtasksInput = z.infer<typeof SuggestSubtasksInputSchema>;

export const SuggestSubtasksOutputSchema = z.object({
  subtasks: z.array(z.string()).describe('A list of suggested subtask descriptions.'),
});
export type SuggestSubtasksOutput = z.infer<typeof SuggestSubtasksOutputSchema>;

// From suggest-task-assignee.ts
export const SuggestTaskAssigneeInputSchema = z.object({
  taskDescription: z.string().describe('The description of the task to be assigned.'),
  taskHistory: z.array(z.object({
    assignee: z.string(),
    taskDescription: z.string(),
    completionTime: z.number().describe('The time taken to complete the task in hours.'),
  })).optional().describe('Historical data of task completion times for each assignee.'),
  assigneeSkills: z.record(z.array(z.string())).optional().describe('A map of available assignee names to their list of skills. Use this to find the best match for the task.'),
});
export type SuggestTaskAssigneeInput = z.infer<typeof SuggestTaskAssigneeInputSchema>;

export const SuggestTaskAssigneeOutputSchema = z.object({
  suggestedAssignee: z.string().describe('The suggested assignee for the task.'),
  reasoning: z.string().describe('The reasoning behind the suggestion.'),
});
export type SuggestTaskAssigneeOutput = z.infer<typeof SuggestTaskAssigneeOutputSchema>;

// From process-command.ts
export const ProcessCommandInputSchema = z.string().describe('The natural language command from the user.');
export type ProcessCommandInput = z.infer<typeof ProcessCommandInputSchema>;

export const ProcessCommandOutputSchema = z.object({
    action: z.enum(['create', 'search', 'none']).describe('The detected action: create a task, search for tasks, or no specific action.'),
    task: z.object({
        title: z.string().describe('The title of the task.'),
        description: z.string().optional().describe('The detailed description of the task.'),
        dueDate: z.string().optional().describe("The due date in 'YYYY-MM-DD' format if specified."),
        priority: z.enum(['Laag', 'Midden', 'Hoog', 'Urgent']).optional().describe('The priority of the task.'),
        assignee: z.string().optional().describe('The name of the person the task is assigned to.'),
        labels: z.array(z.string()).optional().describe('A list of labels or categories for the task.')
    }).optional().describe('The details of the task to be created, if the action is "create".'),
    searchParameters: z.object({
        term: z.string().optional().describe('Any general keywords or phrases to search for in the title or description.'),
        priority: z.enum(['Laag', 'Midden', 'Hoog', 'Urgent']).optional().describe('Filter by a specific priority.'),
        assignee: z.string().optional().describe('Filter by the name of the person the task is assigned to.'),
        labels: z.array(z.string()).optional().describe('Filter by a list of labels or categories.')
    }).optional().describe('The structured search parameters, if the action is "search".'),
    reasoning: z.string().describe('A brief explanation of why this action was chosen.')
});
export type ProcessCommandOutput = z.infer<typeof ProcessCommandOutputSchema>;

// From generate-avatar-flow.ts
export const GenerateAvatarInputSchema = z.string().describe("The user's name or email to base the avatar on.");
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

export const GenerateAvatarOutputSchema = z.object({
  avatarDataUri: z.string().describe("A data URI of the generated avatar image. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

// From generate-task-image-flow.ts
export const GenerateTaskImageInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().optional().describe('The description of the task.'),
});
export type GenerateTaskImageInput = z.infer<typeof GenerateTaskImageInputSchema>;

export const GenerateTaskImageOutputSchema = z.object({
  imageDataUri: z.string().describe("A data URI of the generated image. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateTaskImageOutput = z.infer<typeof GenerateTaskImageOutputSchema>;

// From text-to-speech-flow.ts
export const TextToSpeechInputSchema = z.string().describe("The text to be converted to speech.");
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

export const TextToSpeechOutputSchema = z.object({
    audioDataUri: z.string().describe("A data URI of the generated audio. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

// From multi-speaker-tts-flow.ts
export const MultiSpeakerTextToSpeechInputSchema = z.object({
  comments: z.array(z.object({
    userId: z.string(),
    userName: z.string(),
    text: z.string(),
  })).describe('An array of comments to be converted into a multi-speaker conversation.'),
});
export type MultiSpeakerTextToSpeechInput = z.infer<typeof MultiSpeakerTextToSpeechInputSchema>;

export const MultiSpeakerTextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe("A data URI of the generated multi-speaker audio. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});
export type MultiSpeakerTextToSpeechOutput = z.infer<typeof MultiSpeakerTextToSpeechOutputSchema>;
