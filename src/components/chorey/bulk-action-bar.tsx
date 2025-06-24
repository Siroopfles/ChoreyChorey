'use client';

import { useTasks } from "@/contexts/task-context";
import { Button } from "@/components/ui/button";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ALL_STATUSES } from "@/lib/types";
import { Replace, Trash2, X } from "lucide-react";

export default function BulkActionBar() {
    const { selectedTaskIds, bulkUpdateTasks, setSelectedTaskIds } = useTasks();

    if (selectedTaskIds.length === 0) {
        return null;
    }

    const handleDelete = () => {
        bulkUpdateTasks(selectedTaskIds, { status: 'Geannuleerd' });
    }

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-4 bg-card border rounded-lg shadow-2xl p-2 animate-in fade-in-50 slide-in-from-bottom-5">
                <span className="text-sm font-medium pl-2 pr-1">{selectedTaskIds.length} geselecteerd</span>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Replace className="mr-2 h-4 w-4" />
                            Status wijzigen
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {ALL_STATUSES.map(status => (
                            <DropdownMenuItem 
                                key={status}
                                onSelect={() => bulkUpdateTasks(selectedTaskIds, { status })}
                            >
                                {status}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
                     <Trash2 className="mr-2 h-4 w-4" />
                    Verwijderen
                </Button>

                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedTaskIds([])}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
