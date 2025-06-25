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
