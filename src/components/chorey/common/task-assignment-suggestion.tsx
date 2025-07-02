
'use client';

import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { suggestTaskAssignee } from '@/ai/flows/assistance-suggestion/suggest-task-assignee';
import { Lightbulb, Loader2 } from 'lucide-react';
import type { User } from '@/lib/types';
import { useAuth } from '@/contexts/user/auth-context';
import { useTasks } from '@/contexts/feature/task-context';
import { AIFeedback } from '@/components/chorey/common/ai-feedback';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { useOrganization } from '@/contexts/system/organization-context';

export function TaskAssignmentSuggestion() {
  const form = useFormContext();
  const { users: orgUsers } = useOrganization();
  const { tasks } = useTasks();

  const { trigger: triggerSuggestion, data: suggestion, isLoading, error } = useAiSuggestion(suggestTaskAssignee, {
    onSuccess: (result) => {
      const suggestedUser = orgUsers.find(u => u.name === result.output.suggestedAssignee);
      if (suggestedUser) {
        form.setValue('assigneeIds', [suggestedUser.id]);
      }
    }
  });
  
  const handleSuggest = async () => {
    const taskDescription = form.watch('description');
    triggerSuggestion({ taskDescription, orgUsers, allTasks: tasks });
  };

  const taskDescription = form.watch('description');
  
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleSuggest}
        disabled={isLoading || !taskDescription}
        className="w-full"
      >
        {isLoading ? (
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
          <AIFeedback
            flowName="suggestTaskAssigneeFlow"
            input={suggestion.input}
            output={suggestion.output}
          />
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
