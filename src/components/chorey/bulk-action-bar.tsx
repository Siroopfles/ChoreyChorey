'use client';

import { useTasks } from "@/contexts/task-context";
import { Button } from "@/components/ui/button";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import type { Priority } from "@/lib/types";
import { ALL_STATUSES, ALL_PRIORITIES } from "@/lib/types";
import { Replace, Trash2, X, UserPlus, ArrowUpNarrowWide } from "lucide-react";
import { Separator } from "../ui/separator";

export default function BulkActionBar() {
    const { selectedTaskIds, bulkUpdateTasks, setSelectedTaskIds, users } = useTasks();

    if (selectedTaskIds.length === 0) {
        return null;
    }

    const handleDelete = () => {
        // This is a soft delete, moving tasks to 'Geannuleerd'
        bulkUpdateTasks(selectedTaskIds, { status: 'Geannuleerd' });
    }

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 bg-card border rounded-lg shadow-2xl p-2 animate-in fade-in-50 slide-in-from-bottom-5">
                <span className="text-sm font-medium pl-2 pr-1">{selectedTaskIds.length} geselecteerd</span>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Replace className="mr-2 h-4 w-4" />
                            Status
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

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Toewijzen
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {users.map(user => (
                            <DropdownMenuItem 
                                key={user.id}
                                onSelect={() => bulkUpdateTasks(selectedTaskIds, { assigneeIds: [user.id] })}
                            >
                                {user.name}
                            </DropdownMenuItem>
                        ))}
                         <DropdownMenuItem 
                            onSelect={() => bulkUpdateTasks(selectedTaskIds, { assigneeIds: [] })}
                        >
                            Niemand
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <ArrowUpNarrowWide className="mr-2 h-4 w-4" />
                            Prioriteit
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {ALL_PRIORITIES.map(priority => (
                            <DropdownMenuItem 
                                key={priority}
                                onSelect={() => bulkUpdateTasks(selectedTaskIds, { priority: priority as Priority })}
                            >
                                {priority}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                
                <Separator orientation="vertical" className="h-6" />

                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
                     <Trash2 className="mr-2 h-4 w-4" />
                    Annuleren
                </Button>

                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedTaskIds([])}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}