'use client';

import type { User, Project, Task, SuggestProactiveHelpOutput } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Bot, X } from 'lucide-react';
import { findDuplicateTask } from '@/ai/flows/find-duplicate-task-flow';
import { suggestProactiveHelp } from '@/ai/flows/suggest-proactive-help-flow';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useAuth } from '@/contexts/auth-context';
import type { FindDuplicateTaskOutput } from '@/ai/schemas';
import { useDebounce } from '@/hooks/use-debounce';
import { TaskFormDetails } from './task-form/TaskFormDetails';
import { TaskFormSubtasks } from './task-form/TaskFormSubtasks';
import { TaskFormAdvanced } from './task-form/TaskFormAdvanced';
'''import { AIFeedback } from './ai-feedback';
import { CustomFieldDefinition } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type TaskFormFieldsProps = {
  users: User[];
  projects: Project[];
  task?: Task;
};

const CustomFieldRenderer = ({ field, control }: { field: CustomFieldDefinition, control: any }) => {
  const fieldName = `customFieldValues.${field.id}`;

  return (
    <FormField
      control={control}
      name={fieldName}
      defaultValue={null}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>{field.name}</FormLabel>
          <FormControl>
            {field.type === 'text' && <Input {...formField} />}
            {field.type === 'number' && <Input type="number" {...formField} onChange={e => formField.onChange(parseInt(e.target.value, 10) || null)} />}
            {field.type === 'date' && <Input type="date" {...formField} />}
            {field.type === 'select' && (
              <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                <SelectTrigger>
                  <SelectValue placeholder={`Selecteer een ${field.name}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export function TaskFormFields({ users, projects, task }: TaskFormFieldsProps) {
  const form = useFormContext();
  const { currentOrganization } = useAuth();

  const [isCheckingForDuplicates, setIsCheckingForDuplicates] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<{ output: FindDuplicateTaskOutput, input: any } | null>(null);
  
  const [proactiveHelp, setProactiveHelp] = useState<{ output: SuggestProactiveHelpOutput, input: any } | null>(null);
  const [isCheckingComplexity, setIsCheckingComplexity] = useState(false);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);

  const title = form.watch('title');
  const description = form.watch('description');
  const projectId = form.watch('projectId');
  const debouncedTitle = useDebounce(title, 1500);
  const debouncedDescription = useDebounce(description, 1500);

  useEffect(() => {
    const orgCustomFields = currentOrganization?.settings?.customization?.customFields || [];
    if (projectId) {
      // This is a simplification. In a real scenario, you might have project-specific fields.
      // For now, we assume all custom fields are organization-wide.
      setCustomFields(orgCustomFields);
    } else {
      setCustomFields([]);
    }
  }, [projectId, currentOrganization]);

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
          <AIFeedback
            flowName="suggestProactiveHelpFlow"
            input={proactiveHelp.input}
            output={proactiveHelp.output}
          />
        </Alert>
      )}

      <TaskFormDetails users={users} projects={projects} proactiveHelpSuggestion={proactiveHelp?.output.suggestionType} />
      
      {customFields.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Eigen Velden</h3>
          {customFields.map(field => (
            <CustomFieldRenderer key={field.id} field={field} control={form.control} />
          ))}
        </div>
      )}

      <TaskFormSubtasks task={task} />
      
      <TaskFormAdvanced users={users} projects={projects} task={task} />

    </div>
  );
}''
