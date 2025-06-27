import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Priority } from "./types";

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

export type AttachmentSource = 'google-drive' | 'onedrive' | 'dropbox' | 'figma' | 'gitlab' | 'bitbucket' | 'adobe-xd' | 'generic-link';

export function getAttachmentSource(url: string | undefined): AttachmentSource {
    if (!url) return 'generic-link';
    if (url.includes('drive.google.com')) return 'google-drive';
    if (url.includes('dropbox.com')) return 'dropbox';
    if (url.includes('onedrive.live.com') || url.includes('1drv.ms')) return 'onedrive';
    if (url.includes('figma.com')) return 'figma';
    if (url.includes('xd.adobe.com')) return 'adobe-xd';
    if (url.includes('gitlab.com')) return 'gitlab';
    if (url.includes('bitbucket.org')) return 'bitbucket';
    return 'generic-link';
}
