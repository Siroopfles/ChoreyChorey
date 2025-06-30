import type { HistoryEntry } from "@/lib/types";

/**
 * Creates a standard history entry object for tasks.
 * @param userId The ID of the user performing the action, or 'system'.
 * @param action A short description of the action, e.g., 'Aangemaakt'.
 * @param details Optional further details about the action.
 * @returns A HistoryEntry object.
 */
export function addHistoryEntry(userId: string | null, action: string, details?: string): HistoryEntry {
  const entry: any = {
      id: crypto.randomUUID(),
      userId: userId || 'system',
      timestamp: new Date(),
      action,
  };
  if (details) {
      entry.details = details;
  }
  return entry;
};
