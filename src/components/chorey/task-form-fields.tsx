
'use client';

import type { User, Project, Task, SuggestProactiveHelpOutput } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Bot, X } from 'lucide-react';
import { handleFindDuplicateTask, handleSuggestProactiveHelp } from '@/app/actions/ai.actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RichTextEditor } from '../ui/rich-text-editor';
import { useAuth } from '@/contexts/auth-context';
import type { FindDuplicateTaskOutput } from '@/ai/schemas';
import { useDebounce } from '@/hooks/use-debounce';
import { TaskFormDetails } from './task-form/TaskFormDetails';
import { TaskFormSubtasks } from './task-form/TaskFormSubtasks';
import { TaskFormAdvanced } from './task-form/TaskFormAdvanced';

type TaskFormFieldsProps = {
  users: User[];
  projects: Project[];
  task?: Task;
};

export function TaskFormFields({ users, projects, task }: TaskFormFieldsProps) {
  const form = useFormContext();
  const { currentOrganization } = useAuth();

  const [isCheckingForDuplicates, setIsCheckingForDuplicates] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<FindDuplicateTaskOutput | null>(null);
  
  const [proactiveHelp, setProactiveHelp] = useState<SuggestProactiveHelpOutput | null>(null);
  const [isCheckingComplexity, setIsCheckingComplexity] = useState(false);

  const title = form.watch('title');
  const description = form.watch('description');
  const debouncedTitle = useDebounce(title, 1500);
  const debouncedDescription = useDebounce(description, 1500);

  useEffect(() => {
    if (!debouncedTitle || debouncedTitle.length < 10 || proactiveHelp || isCheckingComplexity) {
      if (proactiveHelp && (!debouncedTitle || debouncedTitle.length < 10)) {
        setProactiveHelp(null);
      }
      return;
    }

    const checkForHelp = async () => {
      setIsCheckingComplexity(true);
      const result = await handleSuggestProactiveHelp({ title: debouncedTitle, description: debouncedDescription });
      if (result.suggestion?.shouldOfferHelp) {
        setProactiveHelp(result.suggestion);
      } else {
        setProactiveHelp(null);
      }
      setIsCheckingComplexity(false);
    };

    checkForHelp();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedDescription]);

  const onCheckForDuplicates = async () => {
    const title = form.getValues('title');
    if (!title || !currentOrganization) return;
    setIsCheckingForDuplicates(true);
    setDuplicateResult(null);

    const description = form.getValues('description');
    const result = await handleFindDuplicateTask({
      organizationId: currentOrganization.id,
      title,
      description
    });
    
    if (result.error) {
        console.error(result.error);
    } else if (result.result) {
      setDuplicateResult(result.result);
    }
    setIsCheckingForDuplicates(false);
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
            <Alert variant={duplicateResult.isDuplicate ? 'destructive' : 'default'}>
              <Bot className="h-4 w-4" />
              <AlertTitle>
                {duplicateResult.isDuplicate 
                  ? `Mogelijk Duplicaat Gevonden: "${duplicateResult.duplicateTaskTitle}"` 
                  : "Geen Duplicaat Gevonden"}
              </AlertTitle>
              <AlertDescription>{duplicateResult.reasoning}</AlertDescription>
            </Alert>
          )}
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Omschrijving</FormLabel>
            <FormControl>
              <RichTextEditor
                placeholder="Voeg een meer gedetailleerde omschrijving toe..."
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {proactiveHelp && (
        <Alert className="mt-4">
          <Bot className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>AI Assistent</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setProactiveHelp(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription>
            {proactiveHelp.reason}
          </AlertDescription>
        </Alert>
      )}

      <TaskFormDetails users={users} projects={projects} proactiveHelpSuggestion={proactiveHelp?.suggestionType} />
      
      <TaskFormSubtasks task={task} />
      
      <TaskFormAdvanced users={users} projects={projects} task={task} />

    </div>
  );
}
