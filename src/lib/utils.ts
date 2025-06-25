import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Priority } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculatePoints = (priority: Priority): number => {
    switch (priority) {
        case 'Urgent': return 30;
        case 'Hoog': return 20;
        case 'Midden': return 10;
        case 'Laag': return 5;
        default: return 0;
    }
};
