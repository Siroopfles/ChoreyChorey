
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Priority, HistoryEntry } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculatePoints = (priority: Priority, storyPoints?: number): number => {
    let priorityPoints = 0;
    switch (priority) {
        case 'Urgent': priorityPoints = 30; break;
        case 'Hoog': priorityPoints = 20; break;
        case 'Midden': priorityPoints = 10; break;
        case 'Laag': priorityPoints = 5; break;
    }
    
    // Story points worden direct bij de prioriteitspunten opgeteld.
    // 1 story point = 1 extra punt
    const finalPoints = priorityPoints + (storyPoints || 0);

    return finalPoints;
};

export type AttachmentSource = 'google-doc' | 'google-sheet' | 'google-slide' | 'google-drive' | 'onedrive' | 'dropbox' | 'figma' | 'gitlab' | 'bitbucket' | 'adobe-xd' | 'generic-link';

export function getAttachmentSource(url: string | undefined): AttachmentSource {
    if (!url) return 'generic-link';
    if (url.includes('docs.google.com/document/')) return 'google-doc';
    if (url.includes('docs.google.com/spreadsheets/')) return 'google-sheet';
    if (url.includes('docs.google.com/presentation/')) return 'google-slide';
    if (url.includes('drive.google.com')) return 'google-drive';
    if (url.includes('dropbox.com')) return 'dropbox';
    if (url.includes('onedrive.live.com') || url.includes('1drv.ms')) return 'onedrive';
    if (url.includes('figma.com')) return 'figma';
    if (url.includes('xd.adobe.com')) return 'adobe-xd';
    if (url.includes('gitlab.com')) return 'gitlab';
    if (url.includes('bitbucket.org')) return 'bitbucket';
    return 'generic-link';
}

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
