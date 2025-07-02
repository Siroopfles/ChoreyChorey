
import { z } from 'genkit';

// From suggest-story-points.ts
export const SuggestStoryPointsInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().optional().describe('The description of the task.'),
  taskHistory: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    points: z.number(),
  })).optional().describe('A list of recently completed tasks with their story points to provide context for the estimation.'),
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
export const ProcessCommandInputSchema = z.object({
  command: z.string().describe('The natural language command from the user.'),
  userId: z.string().describe('The ID of the user issuing the command.'),
  organizationId: z.string().describe('The ID of the current organization.'),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format.'),
  userName: z.string().describe('The name of the user issuing the command.'),
});
export type ProcessCommandInput = z.infer<typeof ProcessCommandInputSchema>;

export const ProcessCommandOutputSchema = z.string().describe('A concise, friendly, natural language summary of the actions taken or the information found. This will be shown directly to the user.');
export type ProcessCommandOutput = z.infer<typeof ProcessCommandOutputSchema>;

// From generate-avatar-flow.ts
export const GenerateAvatarInputSchema = z.object({
  userId: z.string().describe("The user's unique ID."),
  name: z.string().describe("The user's name or email to base the avatar on.")
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

export const GenerateAvatarOutputSchema = z.object({
  avatarUrl: z.string().url().describe("A public URL to the generated avatar image in Firebase Storage."),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

// From generate-task-image-flow.ts
export const GenerateTaskImageInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().optional().describe('The description of the task.'),
  primaryColor: z.string().optional().describe('The primary branding color of the organization, in HSL format (e.g., "221.2 83.2% 53.3%").'),
});
export type GenerateTaskImageInput = z.infer<typeof GenerateTaskImageInputSchema>;

export const GenerateTaskImageOutputSchema = z.object({
  imageUrl: z.string().url().describe("A public URL to the generated image in Firebase Storage."),
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

// From suggest-priority.ts
export const SuggestPriorityInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().optional().describe('The description of the task.'),
  availablePriorities: z.array(z.string()).describe('A list of available priority names for the organization.'),
});
export type SuggestPriorityInput = z.infer<typeof SuggestPriorityInputSchema>;

export const SuggestPriorityOutputSchema = z.object({
  priority: z.string().describe('The suggested priority from the list of available priorities.'),
  reasoning: z.string().describe('A brief explanation for the suggested priority value.'),
});
export type SuggestPriorityOutput = z.infer<typeof SuggestPriorityOutputSchema>;

// From suggest-labels-flow.ts
export const SuggestLabelsInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().optional().describe('The description of the task.'),
  availableLabels: z.array(z.string()).describe('The list of available labels to choose from.'),
});
export type SuggestLabelsInput = z.infer<typeof SuggestLabelsInputSchema>;

export const SuggestLabelsOutputSchema = z.object({
  labels: z.array(z.string()).describe('A list of suggested labels from the predefined list.'),
});
export type SuggestLabelsOutput = z.infer<typeof SuggestLabelsOutputSchema>;

// From identify-risk.ts
export const IdentifyRiskInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().optional().describe('The description of the task.'),
});
export type IdentifyRiskInput = z.infer<typeof IdentifyRiskInputSchema>;

export const IdentifyRiskOutputSchema = z.object({
  hasRisk: z.boolean().describe('Whether a significant risk has been identified.'),
  riskLevel: z.enum(['Laag', 'Midden', 'Hoog']).describe('The identified risk level.'),
  analysis: z.string().describe('A brief analysis of the potential risks.'),
});
export type IdentifyRiskOutput = z.infer<typeof IdentifyRiskOutputSchema>;

// From meeting-to-tasks-flow.ts
export const MeetingToTasksInputSchema = z.object({
  notes: z.string().describe('The raw text notes from a meeting.'),
  organizationId: z.string().describe('The ID of the organization where tasks should be created.'),
  creatorId: z.string().describe('The ID of the user initiating the process.'),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format, for interpreting relative dates like "tomorrow".'),
});
export type MeetingToTasksInput = z.infer<typeof MeetingToTasksInputSchema>;

export const MeetingToTasksOutputSchema = z.string().describe('A natural language summary of the tasks that were created.');
export type MeetingToTasksOutput = z.infer<typeof MeetingToTasksOutputSchema>;

// From find-duplicate-task-flow.ts
export const FindDuplicateTaskInputSchema = z.object({
  organizationId: z.string().describe('The ID of the organization to search within.'),
  title: z.string().describe('The title of the task being checked.'),
  description: z.string().optional().describe('The description of the task being checked.'),
});
export type FindDuplicateTaskInput = z.infer<typeof FindDuplicateTaskInputSchema>;

export const FindDuplicateTaskOutputSchema = z.object({
  isDuplicate: z.boolean().describe('Whether a likely duplicate was found.'),
  duplicateTaskId: z.string().optional().describe('The ID of the likely duplicate task, if found.'),
  duplicateTaskTitle: z.string().optional().describe('The title of the likely duplicate task, if found.'),
  reasoning: z.string().describe('A brief explanation of why the task is or is not considered a duplicate.'),
});
export type FindDuplicateTaskOutput = z.infer<typeof FindDuplicateTaskOutputSchema>;

// From notification-digest-flow.ts
export const NotificationDigestInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom to generate the digest.'),
  organizationId: z.string().describe('The ID of the organization.'),
  period: z.enum(['daily', 'weekly']).describe('The time period for the digest.'),
});
export type NotificationDigestInput = z.infer<typeof NotificationDigestInputSchema>;

export const NotificationDigestOutputSchema = z.string().describe('A markdown-formatted summary of the notifications.');
export type NotificationDigestOutput = z.infer<typeof NotificationDigestOutputSchema>;

// From level-workload-flow.ts
export const LevelWorkloadInputSchema = z.object({
  userId: z.string().describe('The ID of the user whose workload to level.'),
  userName: z.string().describe('The name of the user.'),
  organizationId: z.string().describe('The ID of the organization.'),
  startDate: z.string().describe('The start date of the period to analyze (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date of the period to analyze (YYYY-MM-DD).'),
});
export type LevelWorkloadInput = z.infer<typeof LevelWorkloadInputSchema>;

export const LevelWorkloadOutputSchema = z.string().describe('A natural language summary of the changes made to the workload.');
export type LevelWorkloadOutput = z.infer<typeof LevelWorkloadOutputSchema>;

// From suggest-headcount-flow.ts
export const SuggestHeadcountInputSchema = z.object({
  projectDescription: z.string().describe('A detailed description of the project, including its goals, scope, and key deliverables.'),
  availableUsers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string().describe('The user\'s role in the organization, e.g., "Developer", "Designer", "Project Manager".'),
    skills: z.array(z.string()).optional().describe('A list of the user\'s skills.'),
  })).describe('A list of all available users in the organization with their roles and skills.'),
});
export type SuggestHeadcountInput = z.infer<typeof SuggestHeadcountInputSchema>;

export const SuggestHeadcountOutputSchema = z.object({
  suggestedRoles: z.array(z.object({
    role: z.string().describe('The role required for the project.'),
    count: z.number().describe('The number of people required for this role.'),
    skills: z.array(z.string()).optional().describe('Specific skills recommended for this role on this project.'),
  })).describe('A list of suggested roles and the required number of people for each.'),
  reasoning: z.string().describe('A summary of the reasoning behind the headcount suggestion.'),
  totalHeadcount: z.number().describe('The total number of people suggested for the project.'),
});
export type SuggestHeadcountOutput = z.infer<typeof SuggestHeadcountOutputSchema>;

// From email-to-task-flow.ts
export const EmailToTaskInputSchema = z.object({
  from: z.string().describe("The sender's email address."),
  to: z.string().describe("The recipient's email address, which contains routing information."),
  subject: z.string().describe("The subject of the email, which becomes the task title."),
  body: z.string().describe("The body of the email, which becomes the task description."),
});
export type EmailToTaskInput = z.infer<typeof EmailToTaskInputSchema>;

export const EmailToTaskOutputSchema = z.string().describe("A summary of the result, e.g., 'Task created' or an error message.");
export type EmailToTaskOutput = z.infer<typeof EmailToTaskOutputSchema>;

// From suggest-proactive-help-flow.ts
export const SuggestProactiveHelpInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().optional().describe('The description of the task.'),
});
export type SuggestProactiveHelpInput = z.infer<typeof SuggestProactiveHelpInputSchema>;

export const SuggestProactiveHelpOutputSchema = z.object({
  shouldOfferHelp: z.boolean().describe('Whether or not the AI should proactively offer help for this task.'),
  reason: z.string().describe('A short, encouraging reason why help might be useful. Empty if shouldOfferHelp is false.'),
  suggestionType: z.enum(['subtasks', 'story_points', 'none']).describe('The most relevant type of suggestion to offer.'),
});
export type SuggestProactiveHelpOutput = z.infer<typeof SuggestProactiveHelpOutputSchema>;

// From suggest-status-update-flow.ts
const StatusUpdateEventSchema = z.union([
  z.object({
    type: z.literal('comment_added'),
    comment: z.string().describe('The content of the comment that was added.'),
  }),
  z.object({
    type: z.literal('pr_merged'),
    prTitle: z.string().describe('The title of the pull request that was merged.'),
  }),
  z.object({
    type: z.literal('commit_pushed'),
    commitMessage: z.string().describe('The commit message.'),
  }),
]);

export const SuggestStatusUpdateInputSchema = z.object({
  taskId: z.string(),
  organizationId: z.string(),
  currentStatus: z.string(),
  availableStatuses: z.array(z.string()),
  taskTitle: z.string(),
  event: StatusUpdateEventSchema,
});
export type SuggestStatusUpdateInput = z.infer<typeof SuggestStatusUpdateInputSchema>;

export const SuggestStatusUpdateOutputSchema = z.object({
  shouldUpdate: z.boolean().describe('Whether a status update is suggested.'),
  newStatus: z.string().optional().describe('The suggested new status for the task.'),
  reasoning: z.string().describe('The reasoning behind the suggestion.'),
});
export type SuggestStatusUpdateOutput = z.infer<typeof SuggestStatusUpdateOutputSchema>;


// From feedback.actions.ts
export const AiFeedbackInputSchema = z.object({
  flowName: z.string().describe('The name of the AI flow that generated the suggestion.'),
  input: z.any().describe('The input that was provided to the flow.'),
  output: z.any().describe('The output that was generated by the flow.'),
  feedback: z.enum(['positive', 'negative']).describe('The user\'s feedback.'),
  userId: z.string(),
  organizationId: z.string(),
});
export type AiFeedbackInput = z.infer<typeof AiFeedbackInputSchema>;

// From predict-burnout-risk-flow.ts
export const PredictBurnoutRiskInputSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  organizationId: z.string(),
});
export type PredictBurnoutRiskInput = z.infer<typeof PredictBurnoutRiskInputSchema>;

export const PredictBurnoutRiskOutputSchema = z.object({
  isAtRisk: z.boolean().describe('Indicates whether the user is considered at risk of burnout.'),
  riskLevel: z.enum(['Geen', 'Laag', 'Midden', 'Hoog']).describe('The assessed level of burnout risk.'),
  reasoning: z.string().describe('A detailed analysis explaining the risk assessment, based on workload, task types, and patterns.'),
  suggestions: z.array(z.string()).describe('A list of actionable suggestions for managers to mitigate the identified risk.'),
});
export type PredictBurnoutRiskOutput = z.infer<typeof PredictBurnoutRiskOutputSchema>;

// From generate-project-report-flow.ts
export const GenerateProjectReportInputSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  organizationId: z.string(),
});
export type GenerateProjectReportInput = z.infer<typeof GenerateProjectReportInputSchema>;

export const GenerateProjectReportOutputSchema = z.object({
    report: z.string().describe('A comprehensive project status report in Markdown format. The report should be written in Dutch.'),
});
export type GenerateProjectReportOutput = z.infer<typeof GenerateProjectReportOutputSchema>;

// From predict-project-outcome-flow.ts
export const PredictProjectOutcomeInputSchema = z.object({
  projectId: z.string(),
  organizationId: z.string(),
});
export type PredictProjectOutcomeInput = z.infer<typeof PredictProjectOutcomeInputSchema>;

export const PredictProjectOutcomeOutputSchema = z.object({
  onTrackStatus: z.enum(['ON_TRACK', 'AT_RISK', 'OFF_TRACK']).describe("A classification of the project's current status based on the prediction."),
  predictedCompletionDate: z.string().describe("The AI's best estimate for the project completion date in YYYY-MM-DD format."),
  budgetPrediction: z.string().describe("A short summary of the budget forecast (e.g., 'Likely to stay within budget', 'At risk of overspending by 15%')."),
  confidenceScore: z.number().min(0).max(100).describe("A confidence score (0-100) for the overall prediction."),
  reasoning: z.string().describe("A detailed explanation of the prediction, including analysis of burn rate, velocity, and potential risks."),
  recommendations: z.array(z.string()).describe("A list of actionable recommendations to mitigate risks or improve project outcomes."),
});
export type PredictProjectOutcomeOutput = z.infer<typeof PredictProjectOutcomeOutputSchema>;

// From what-if-scenario-flow.ts
export const WhatIfScenarioInputSchema = z.object({
  projectId: z.string(),
  organizationId: z.string(),
  scenarioDescription: z.string().describe("The user's what-if scenario. For example: 'What if we add two more developers?' or 'What is the impact if the design phase takes 3 weeks longer?'.")
});
export type WhatIfScenarioInput = z.infer<typeof WhatIfScenarioInputSchema>;

export const WhatIfScenarioOutputSchema = z.object({
  impactSummary: z.string().describe("A one-sentence summary of the main impact."),
  predictedCompletionDateChange: z.string().describe("The change in the predicted completion date. E.g., 'Delayed by 2 weeks', 'No significant change', 'Accelerated by 5 days'."),
  newPredictedCompletionDate: z.string().describe("The new predicted completion date in YYYY-MM-DD format."),
  budgetImpact: z.string().describe("A summary of the impact on the budget. E.g., 'Increased cost of €5000', 'Potential savings', 'No direct budget impact'."),
  reasoning: z.string().describe("A detailed explanation of why the scenario has this impact, considering task dependencies, resource availability, and workload."),
  recommendations: z.array(z.string()).describe("A list of actionable recommendations to mitigate risks or capitalize on opportunities presented by the scenario."),
});
export type WhatIfScenarioOutput = z.infer<typeof WhatIfScenarioOutputSchema>;

// From generate-insights-flow.ts
export const GenerateInsightsInputSchema = z.object({
  organizationId: z.string(),
});
export type GenerateInsightsInput = z.infer<typeof GenerateInsightsInputSchema>;

export const GenerateInsightsOutputSchema = z.object({
  insights: z.array(z.object({
    category: z.enum(['Productivity', 'Workflow', 'Team Dynamics', 'Planning & Estimation', 'Data Quality', 'Data']).describe('The category of the insight.'),
    title: z.string().describe('A short, descriptive title for the insight.'),
    finding: z.string().describe('A clear, concise explanation of what was discovered.'),
    evidence: z.string().describe('Brief, specific data or examples to support the finding.'),
  })),
});
export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

// From predict-task-completion-flow.ts
export const PredictTaskCompletionInputSchema = z.object({
  organizationId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.string(),
  storyPoints: z.number().optional().nullable(),
});
export type PredictTaskCompletionInput = z.infer<typeof PredictTaskCompletionInputSchema>;

export const PredictTaskCompletionOutputSchema = z.object({
  predictedCompletionDate: z.string().describe("The predicted completion date in YYYY-MM-DD format."),
  confidenceScore: z.number().min(0).max(100).describe("A confidence score (0-100) for the prediction."),
  reasoning: z.string().describe("A brief explanation for the predicted date and confidence score."),
});
export type PredictTaskCompletionOutput = z.infer<typeof PredictTaskCompletionOutputSchema>;
