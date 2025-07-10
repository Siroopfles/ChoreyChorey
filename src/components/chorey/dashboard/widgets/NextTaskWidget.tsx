
'use client';

import { useMemo, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Target, RefreshCw, Loader2, Zap } from 'lucide-react';
import { useTasks } from '@/contexts/feature/task-context';
import { useAuth } from '@/contexts/user/auth-context';
import { suggestNextTask } from '@/ai/flows/assistance-suggestion/suggest-next-task-flow';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export function NextTaskWidget() {
  const { user } = useAuth();
  const { setViewedTask, tasks } = useTasks();
  
  const { 
    trigger: triggerSuggestion, 
    data, 
    isLoading 
  } = useAiSuggestion(suggestNextTask, {
    onError: (error) => {
        // Specific error handling if needed
    },
  });

  const handleSuggest = () => {
    if (!user || !user.currentOrganizationId) return;
    triggerSuggestion({ userId: user.id, userName: user.name, organizationId: user.currentOrganizationId });
  };

  // Make the suggestion proactive by calling it on mount
  useEffect(() => {
    handleSuggest();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const suggestedTask = useMemo(() => {
    if (!data?.output?.taskId) return null;
    return tasks.find(t => t.id === data.output.taskId);
  }, [data, tasks]);

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
            <CardTitle className="flex items-center gap-2">
                <Target />
                Beste Volgende Actie (AI)
            </CardTitle>
            <CardDescription>Je AI-assistent stelt je volgende focus voor.</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSuggest} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
        {isLoading && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}
        
        {!isLoading && data && (
            suggestedTask ? (
                <div className="space-y-3">
                    <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertTitle>Suggestie</AlertTitle>
                        <AlertDescription>
                            {data.output.reasoning}
                        </AlertDescription>
                    </Alert>
                    <Button onClick={() => setViewedTask(suggestedTask)} className="w-full">
                        <Zap className="mr-2 h-4 w-4" />
                        Start: {data.output.taskTitle}
                    </Button>
                </div>
            ) : (
                 <p className="text-sm text-muted-foreground">{data.output.reasoning || "Geen suggesties op dit moment."}</p>
            )
        )}
      </CardContent>
    </>
  );
}
