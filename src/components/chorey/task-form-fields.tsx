'use client';

import type { User, Project, Task, SuggestProactiveHelpOutput } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Bot, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { findDuplicateTask } from '@/ai/flows/find-duplicate-task-flow';
import { suggestProactiveHelp } from '@/ai/flows/suggest-proactive-help-flow';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { RichTextEditor } from '../ui/rich-text-editor';
import { useAuth } from '@/contexts/auth-context';
import type { FindDuplicateTaskOutput } from '@/ai/schemas';
import { useDebounce } from '@/hooks/use-debounce';
import { TaskFormDetails } from './task-form/TaskFormDetails';
import { TaskFormSubtasks } from './task-form/TaskFormSubtasks';
import { TaskFormAdvanced } from './task-form/TaskFormAdvanced';
import { useToast } from '@/hooks/use-toast';
import { submitAiFeedback } from '@/app/actions/feedback.actions';

type TaskFormFieldsProps = {
  users: User[];
  projects: Project[];
  task?: Task;
};

export function TaskFormFields({ users, projects, task }: TaskFormFieldsProps) {
  const form = useFormContext();
  const { user, currentOrganization } = useAuth();
  const { toast } = useToast();

  const [isCheckingForDuplicates, setIsCheckingForDuplicates] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<{ output: FindDuplicateTaskOutput, input: any } | null>(null);
  const [duplicateFeedbackGiven, setDuplicateFeedbackGiven] = useState(false);
  
  const [proactiveHelp, setProactiveHelp] = useState<{ output: SuggestProactiveHelpOutput, input: any } | null>(null);
  const [proactiveHelpFeedbackGiven, setProactiveHelpFeedbackGiven] = useState(false);
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
      try {
        const result = await suggestProactiveHelp({ title: debouncedTitle, description: debouncedDescription });
        if (result.output.shouldOfferHelp) {
          setProactiveHelp(result);
          setProactiveHelpFeedbackGiven(false);
        } else {
          setProactiveHelp(null);
        }
      } catch (e) {
        // Silently fail, this is a non-critical feature
        console.warn("Proactive help check failed:", e);
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
    setDuplicateFeedbackGiven(false);

    const description = form.getValues('description');
    
    try {
        const result = await findDuplicateTask({
          organizationId: currentOrganization.id,
          title,
          description
        });
        setDuplicateResult(result);
    } catch(e: any) {
        console.error(e);
    }
    
    setIsCheckingForDuplicates(false);
  };
  
  const handleDuplicateCheckFeedback = async (feedback: 'positive' | 'negative') => {
    if (!user || !currentOrganization || !duplicateResult) return;
    setDuplicateFeedbackGiven(true);
    await submitAiFeedback({
      flowName: 'findDuplicateTaskFlow',
      input: duplicateResult.input,
      output: duplicateResult.output,
      feedback,
      userId: user.id,
      organizationId: currentOrganization.id,
    });
    toast({ title: 'Feedback ontvangen!'});
  };

  const handleProactiveHelpFeedback = async (feedback: 'positive' | 'negative') => {
    if (!user || !currentOrganization || !proactiveHelp) return;
    setProactiveHelpFeedbackGiven(true);
    await submitAiFeedback({
      flowName: 'suggestProactiveHelpFlow',
      input: proactiveHelp.input,
      output: proactiveHelp.output,
      feedback,
      userId: user.id,
      organizationId: currentOrganization.id,
    });
    toast({ title: 'Feedback ontvangen!'});
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
               {!duplicateFeedbackGiven ? (
                <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground mr-auto">Nuttig?</p>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDuplicateCheckFeedback('positive')}><ThumbsUp className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDuplicateCheckFeedback('negative')}><ThumbsDown className="h-4 w-4" /></Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">Bedankt voor je feedback!</p>
              )}
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
            {proactiveHelp.output.reason}
          </AlertDescription>
          {!proactiveHelpFeedbackGiven ? (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground mr-auto">Nuttig?</p>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleProactiveHelpFeedback('positive')}><ThumbsUp className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleProactiveHelpFeedback('negative')}><ThumbsDown className="h-4 w-4" /></Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">Bedankt voor je feedback!</p>
          )}
        </Alert>
      )}

      <TaskFormDetails users={users} projects={projects} proactiveHelpSuggestion={proactiveHelp?.output.suggestionType} />
      
      <TaskFormSubtasks task={task} />
      
      <TaskFormAdvanced users={users} projects={projects} task={task} />

    </div>
  );
}
