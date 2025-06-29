import { z } from 'zod';

const envSchema = z.object({
  // Firebase (Public) - These are now optional at the schema level,
  // but will be validated at runtime where they are used (in firebase.ts).
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  
  // Base URL (Public) - Required for OAuth callbacks.
  NEXT_PUBLIC_BASE_URL: z.string().optional(),

  // Google OAuth (Server-side) - Optional
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Microsoft OAuth (Server-side) - Optional
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_TENANT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),

  // Slack (Server-side) - Optional
  SLACK_BOT_TOKEN: z.string().optional(),
  
  // GitHub (Server-side) - Optional
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),

  // GitLab (Server-side) - Optional
  GITLAB_TOKEN: z.string().optional(),

  // Bitbucket (Server-side) - Optional
  BITBUCKET_USERNAME: z.string().optional(),
  BITBUCKET_APP_PASSWORD: z.string().optional(),

  // Jira (Server-side) - Optional
  JIRA_BASE_URL: z.string().url().optional(),
  JIRA_USER_EMAIL: z.string().email().optional(),
  JIRA_API_TOKEN: z.string().optional(),
  
  // General Webhook Secret (Server-side) - Optional, used for Jira webhook
  WEBHOOK_SECRET: z.string().optional(),
});

// The `safeParse` method returns a result object that contains either the parsed data or an error.
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // Log the detailed error to the console during development/build
  console.error(
    '❌ Invalid environment variables:',
    parsedEnv.error.flatten().fieldErrors,
  );

  // This will stop the build process if a required variable is missing.
  throw new Error('Invalid environment variables. Check the console for details.');
}

// Export the validated and typed environment variables for use throughout the app
export const env = parsedEnv.data;
