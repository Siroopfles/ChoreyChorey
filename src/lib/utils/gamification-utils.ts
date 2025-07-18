import type { Priority } from "@/lib/types";

export const calculatePoints = (priority: Priority, storyPoints?: number | null): number => {
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
