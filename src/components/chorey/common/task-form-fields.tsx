
'use client';

import type { User, Project, Task } from '@/lib/types';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Bot, X } from 'lucide-react';
import { findDuplicateTask } from '@/ai/flows/task-management/find-duplicate-task-flow';
import { suggestProactiveHelp } from '@/ai/flows/assistance-suggestion/suggest-proactive-help-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/user/auth-context';
import { useDebounce } from '@/hooks/use-debounce';
import { TaskFormDetails } from '@/components/chorey/task-form/TaskFormDetails';
import { TaskFormSubtasks } from '@/components/chorey/task-form/TaskFormSubtasks';
import { TaskFormAdvanced } from '@/components/chorey/task-form/TaskFormAdvanced';
import { AIFeedback } from '@/components/chorey/common/ai-feedback';
import type { CustomFieldDefinition } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';

type TaskFormFieldsProps = {
  users: User[];
  projects: Project[];
  task?: Task;
};

export function TaskFormFields({ users, projects, task }: TaskFormFieldsProps) {
  const form = useFormContext();
  const { currentOrganization } = useAuth();
  
  const { trigger: triggerDuplicateCheck, data: duplicateResult, isLoading: isCheckingForDuplicates } = useAiSuggestion(findDuplicateTask);
  const { trigger: triggerProactiveHelp, data: proactiveHelp, isLoading: isCheckingComplexity } = useAiSuggestion(suggestProactiveHelp);
  
  const title = form.watch('title');
  const description = form.watch('description');
  const debouncedTitle = useDebounce(title, 1500);
  const debouncedDescription = useDebounce(description, 1500);

  useEffect(() => {
    if (!debouncedTitle || debouncedTitle.length < 10 || proactiveHelp || isCheckingComplexity) {
      return;
    }
    triggerProactiveHelp({ title: debouncedTitle, description: debouncedDescription });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedDescription]);

  const onCheckForDuplicates = () => {
    if (!title || !currentOrganization) return;
    triggerDuplicateCheck({
      organizationId: currentOrganization.id,
      title,
      description,
    });
  };
  
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Titel</FormLabel>
            <FormControl>
              <Input placeholder="bijv., Stofzuig de woonkamer" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

       <div className="space-y-2">
        <Button type="button" variant="outline" size="sm" onClick={onCheckForDuplicates} disabled={isCheckingForDuplicates || !title}>
            {isCheckingForDuplicates ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4"/>}
            Controleer op Duplicaten (AI)
        </Button>
         {duplicateResult && (
            <Alert variant={duplicateResult.output.isDuplicate ? 'destructive' : 'default'}>
              <Bot className="h-4 w-4" />
              <AlertTitle>
                {duplicateResult.output.isDuplicate 
                  ? `Mogelijk Duplicaat Gevonden: "${duplicateResult.output.duplicateTaskTitle}"` 
                  : "Geen Duplicaat Gevonden"}
              </AlertTitle>
              <AlertDescription>{duplicateResult.output.reasoning}</AlertDescription>
               <AIFeedback
                flowName="findDuplicateTaskFlow"
                input={duplicateResult.input}
                output={duplicateResult.output}
               />
            </Alert>
          )}
      </div>

      {proactiveHelp && proactiveHelp.output.shouldOfferHelp && (
        <Alert className="mt-4">
          <Bot className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>AI Assistent</span>
          </AlertTitle>
          <AlertDescription>
            {proactiveHelp.output.reason}
          </AlertDescription>
          <AIFeedback
            flowName="suggestProactiveHelpFlow"
            input={proactiveHelp.input}
            output={proactiveHelp.output}
          />
        </Alert>
      )}

      <TaskFormDetails users={users} projects={projects} proactiveHelpSuggestion={proactiveHelp?.output.suggestionType} />
      
      <TaskFormSubtasks task={task} />
      
      <TaskFormAdvanced users={users} projects={projects} task={task} />

    </div>
  );
}
