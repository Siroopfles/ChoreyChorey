
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTasks } from '@/contexts/task-context';
import { useEffect, useState } from 'react';
import type { Task } from '@/lib/types';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TldrawWhiteboard } from '@/components/chorey/tldraw-whiteboard';

export default function WhiteboardPage() {
    const { taskId } = useParams();
    const router = useRouter();
    const { tasks, loading } = useTasks();
    const [task, setTask] = useState<Task | null>(null);

    useEffect(() => {
        if (!loading) {
            const foundTask = tasks.find(t => t.id === taskId);
            if (foundTask) {
                setTask(foundTask);
            } else {
                router.push('/dashboard');
            }
        }
    }, [taskId, tasks, loading, router]);

    if (loading || !task) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-background">
            <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6 z-10 shrink-0">
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Terug
                </Button>
                <h1 className="font-semibold text-lg truncate">
                    Whiteboard: <span className="text-muted-foreground">{task.title}</span>
                </h1>
            </header>
            <main className="flex-1 min-h-0">
                <TldrawWhiteboard taskId={task.id} whiteboardData={task.whiteboard} />
            </main>
        </div>
    );
}
