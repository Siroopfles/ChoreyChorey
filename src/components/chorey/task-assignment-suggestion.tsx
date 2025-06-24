
'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { handleSuggestAssignee } from '@/app/actions';
import { Lightbulb, Loader2 } from 'lucide-react';
import type { User } from '@/lib/types';
import type { SuggestTaskAssigneeOutput } from '@/ai/flows/suggest-task-assignee';

type TaskAssignmentSuggestionProps = {
  users: User[];
}

export function TaskAssignmentSuggestion({ users }: TaskAssignmentSuggestionProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestTaskAssigneeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useFormContext();
  const taskDescription = form.watch('description');

  const onSuggest = async () => {
    setLoading(true);
    setError(null);
    setSuggestion(null);

    const availableAssignees = users.map(u => u.name);
    const result = await handleSuggestAssignee(taskDescription, availableAssignees);

    if (result.error) {
      setError(result.error);
    } else if (result.suggestion) {
      setSuggestion(result.suggestion);
      const suggestedUser = users.find(u => u.name === result.suggestion?.suggestedAssignee);
      if(suggestedUser) {
        form.setValue('assigneeId', suggestedUser.id);
      }
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={onSuggest}
        disabled={loading || !taskDescription}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Lightbulb className="mr-2 h-4 w-4 text-accent" />
        )}
        Suggest an Assignee (AI)
      </Button>
      {suggestion && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>AI Suggestion: {suggestion.suggestedAssignee}</AlertTitle>
          <AlertDescription>{suggestion.reasoning}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
