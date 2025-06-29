'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { suggestTaskAssignee } from '@/ai/flows/suggest-task-assignee';
import { Lightbulb, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { User } from '@/lib/types';
import type { SuggestTaskAssigneeOutput } from '@/ai/schemas';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { useToast } from '@/hooks/use-toast';
import { submitAiFeedback } from '@/app/actions/feedback.actions';

export function TaskAssignmentSuggestion() {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{ output: SuggestTaskAssigneeOutput, input: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { users: orgUsers, currentOrganization, user } = useAuth();
  const { tasks } = useTasks();
  const form = useFormContext();
  const taskDescription = form.watch('description');
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const { toast } = useToast();

  const onSuggest = async () => {
    if (!currentOrganization) return;
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setFeedbackGiven(false);

    try {
        const result = await suggestTaskAssignee(taskDescription, orgUsers, tasks);
        setSuggestion(result);
        const suggestedUser = orgUsers.find(u => u.name === result.output.suggestedAssignee);
        if(suggestedUser) {
          form.setValue('assigneeIds', [suggestedUser.id]);
        }
    } catch (e: any) {
        setError(e.message);
    }
    setLoading(false);
  };
  
  const handleFeedback = async (feedback: 'positive' | 'negative') => {
    if (!user || !currentOrganization || !suggestion) return;
    setFeedbackGiven(true);
    const result = await submitAiFeedback({
      flowName: 'suggestTaskAssigneeFlow',
      input: suggestion.input,
      output: suggestion.output,
      feedback,
      userId: user.id,
      organizationId: currentOrganization.id,
    });
    if (result.data) {
        toast({ title: 'Feedback ontvangen!', description: 'Bedankt voor je hulp om de AI te verbeteren.' });
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={onSuggest}
        disabled={loading || !taskDescription || !currentOrganization}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Lightbulb className="mr-2 h-4 w-4" />
        )}
        Stel een toewijzer voor (AI)
      </Button>
      {suggestion && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>AI Suggestie: {suggestion.output.suggestedAssignee}</AlertTitle>
          <AlertDescription>{suggestion.output.reasoning}</AlertDescription>
          {!feedbackGiven ? (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground mr-auto">Nuttig?</p>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback('positive')}><ThumbsUp className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback('negative')}><ThumbsDown className="h-4 w-4" /></Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">Bedankt voor je feedback!</p>
          )}
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Fout</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
