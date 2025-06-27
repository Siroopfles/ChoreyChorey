
'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import type { Task, User, HistoryEntry } from '@/lib/types';
import { PERMISSIONS } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditTaskDialog from '@/components/chorey/edit-task-dialog';

// A type that combines the history entry with its parent task info
type AggregatedHistoryEntry = HistoryEntry & {
    taskTitle: string;
    taskId: string;
};

export default function AuditLogPage() {
    const { currentUserPermissions, loading: authLoading } = useAuth();
    const { tasks, users, loading: tasksLoading } = useTasks();
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const aggregatedHistory = useMemo((): AggregatedHistoryEntry[] => {
        if (!tasks || tasks.length === 0) return [];

        const allHistoryEntries = tasks.flatMap(task =>
            (task.history || []).map(entry => ({
                ...entry,
                taskId: task.id,
                taskTitle: task.title
            }))
        );

        return allHistoryEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [tasks]);

    const handleTaskClick = (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            setEditingTask(task);
        }
    };
    
    if (authLoading || tasksLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!currentUserPermissions.includes(PERMISSIONS.VIEW_AUDIT_LOG)) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[400px]">
                <h3 className="text-2xl font-bold tracking-tight">Geen Toegang</h3>
                <p className="text-sm text-muted-foreground">U heeft niet de juiste permissies om deze pagina te bekijken.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck /> Audit Log</h1>
                    <p className="text-muted-foreground">Een gedetailleerd overzicht van alle acties binnen de organisatie.</p>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Gebruiker</TableHead>
                                <TableHead>Actie</TableHead>
                                <TableHead>Taak</TableHead>
                                <TableHead className="text-right">Datum</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {aggregatedHistory.length > 0 ? (
                                aggregatedHistory.map(entry => {
                                    const user = users.find(u => u.id === entry.userId);
                                    return (
                                        <TableRow key={entry.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={user?.avatar} />
                                                        <AvatarFallback>{user?.name.charAt(0) ?? 'S'}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{user?.name ?? 'Systeem'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium">{entry.action}</p>
                                                {entry.details && <p className="text-xs text-muted-foreground truncate max-w-xs">{entry.details}</p>}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="link" className="p-0 h-auto" onClick={() => handleTaskClick(entry.taskId)}>
                                                    {entry.taskTitle}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs">
                                                {format(entry.timestamp, "d MMM yyyy, HH:mm", { locale: nl })}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Geen log-data gevonden.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
             {editingTask && (
                <EditTaskDialog
                  isOpen={!!editingTask}
                  setIsOpen={(isOpen) => { if (!isOpen) setEditingTask(null); }}
                  task={editingTask}
                  users={users}
                />
            )}
        </>
    );
}
