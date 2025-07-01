'use client';

import { useTasks } from '@/contexts/feature/task-context';
import { useAuth } from '@/contexts/user/auth-context';
import { useOrganization } from '@/contexts/system/organization-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { Task, Status } from '@/lib/types';
import { PERMISSIONS } from '@/lib/types';

const raciColors: Record<string, string> = {
    'R': 'bg-blue-500/20 text-blue-700 border-blue-500/50',
    'A': 'bg-green-500/20 text-green-700 border-green-500/50',
    'C': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50',
    'I': 'bg-purple-500/20 text-purple-700 border-purple-500/50',
}

export default function RacimatrixPage() {
    const { tasks, loading: tasksLoading } = useTasks();
    const { currentUserPermissions, loading: authLoading } = useAuth();
    const { users, loading: orgLoading } = useOrganization();

    if (tasksLoading || authLoading || orgLoading) {
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

    const getRaciForUser = (task: Task, userId: string): string[] => {
        const roles = [];
        if (task.assigneeIds.includes(userId)) roles.push('R'); // Responsible
        if (task.creatorId === userId) roles.push('A'); // Accountable
        if (task.consultedUserIds?.includes(userId)) roles.push('C'); // Consulted
        if (task.informedUserIds?.includes(userId)) roles.push('I'); // Informed
        // Remove duplicates, e.g. someone is creator and assignee
        return [...new Set(roles)];
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/organization">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Terug</span>
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2"><UserCheck /> RACI Matrix</h1>
                    <p className="text-muted-foreground">Overzicht van rollen en verantwoordelijkheden per taak.</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[250px] sticky left-0 bg-card z-10">Taak</TableHead>
                                    {users.map(user => (
                                        <TableHead key={user.id} className="text-center">{user.name}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.map(task => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium sticky left-0 bg-card z-10">{task.title}</TableCell>
                                        {users.map(user => {
                                            const roles = getRaciForUser(task, user.id);
                                            return (
                                                <TableCell key={user.id} className="text-center">
                                                    <div className="flex justify-center items-center gap-1">
                                                        {roles.length > 0 ? roles.map(role => (
                                                            <Badge key={role} variant="outline" className={`w-6 h-6 justify-center ${raciColors[role] || ''}`}>{role}</Badge>
                                                        )) : null}
                                                    </div>
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
