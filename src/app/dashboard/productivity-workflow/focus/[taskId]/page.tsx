
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTasks } from '@/contexts/feature/task-context';
import { useAuth } from '@/contexts/user/auth-context';
import { useEffect, useState } from 'react';
import type { Task } from '@/lib/types';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TaskComments } from '@/components/chorey/common/task-comments';
import { TaskHistory } from '@/components/chorey/common/task-history';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils/utils';

export default function FocusPage() {
    const { taskId } = useParams();
    const router = useRouter();
    const { tasks, users, loading, toggleSubtaskCompletion, addComment } = useTasks();
    const { user: currentUser } = useAuth();
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
        <div className="min-h-screen bg-muted/40 p-4 sm:p-8 md:p-12">
            <div className="absolute top-4 right-4 z-10">
                <Button variant="ghost" size="lg" onClick={() => router.push('/dashboard')}>
                    <X className="mr-2 h-5 w-5" />
                    Focus Modus Verlaten
                </Button>
            </div>
            
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold tracking-tight">{task.title}</h1>
                {task.description && <div className="text-lg text-muted-foreground mt-2 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{__html: task.description}} />}
                
                <Separator className="my-8" />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                         <div>
                             <h2 className="text-2xl font-semibold mb-4">Subtaken</h2>
                             {task.subtasks.length > 0 ? (
                                 <div className="space-y-3">
                                     {task.subtasks.map(subtask => (
                                         <div key={subtask.id} className="flex items-center gap-3 p-3 bg-card rounded-md border">
                                             <Checkbox
                                                 id={`focus-subtask-${subtask.id}`}
                                                 checked={subtask.completed}
                                                 onCheckedChange={() => toggleSubtaskCompletion(task.id, subtask.id)}
                                                 className="h-5 w-5"
                                             />
                                             <label
                                                 htmlFor={`focus-subtask-${subtask.id}`}
                                                 className={cn("text-base leading-none", subtask.completed && "line-through text-muted-foreground")}
                                             >
                                                 {subtask.text}
                                             </label>
                                         </div>
                                     ))}
                                 </div>
                             ) : (
                                 <p className="text-muted-foreground">Deze taak heeft geen subtaken.</p>
                             )}
                         </div>

                         <div className="h-[500px] flex flex-col">
                             <h2 className="text-2xl font-semibold mb-4">Reacties</h2>
                             <TaskComments taskId={task.id} comments={task.comments} users={users} addComment={addComment} />
                         </div>
                    </div>
                    <div className="space-y-6">
                        <div className="h-[600px] flex flex-col">
                            <h2 className="text-2xl font-semibold mb-4">Geschiedenis</h2>
                             <TaskHistory task={task} users={users} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
