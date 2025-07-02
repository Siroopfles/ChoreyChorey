'use client';

import type { User, Project, Task } from '@/lib/types';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Bot, X, Check, Tags, Briefcase, Lightbulb } from 'lucide-react';
import { findDuplicateTask } from '@/ai/flows/task-management/find-duplicate-task-flow';
import { suggestProactiveHelp } from '@/ai/flows/assistance-suggestion/suggest-proactive-help-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/user/auth-context';
import { useDebounce } from '@/hooks/use-debounce';
import { TaskAssignmentSuggestion } from '@/components/chorey/common/task-assignment-suggestion';
import { useOrganization } from '@/contexts/system/organization-context';
import { AIFeedback } from '@/components/chorey/common/ai-feedback';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { suggestStoryPoints } from '@/ai/flows/assistance-suggestion/suggest-story-points';
import { suggestPriority } from '@/ai/flows/assistance-suggestion/suggest-priority';
import { suggestLabels } from '@/ai/flows/assistance-suggestion/suggest-labels-flow';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/utils';

type TaskFormDetailsProps = {
  users: User[];
  projects: Project[];
  proactiveHelpSuggestion?: 'subtasks' | 'story_points' | 'none';
};

export function TaskFormDetails({ users, projects, proactiveHelpSuggestion }: TaskFormDetailsProps) {
  const form = useFormContext();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const { trigger: triggerDuplicateCheck, data: duplicateResult, isLoading: isCheckingForDuplicates } = useAiSuggestion(findDuplicateTask);
  const { trigger: triggerProactiveHelp, data: proactiveHelp, isLoading: isCheckingComplexity } = useAiSuggestion(suggestProactiveHelp);
  const { trigger: triggerPoints, data: pointsSuggestion, isLoading: isSuggestingPoints } = useAiSuggestion(suggestStoryPoints, {
    onSuccess: (result) => form.setValue('storyPoints', result.output.points)
  });
  const { trigger: triggerPriority, data: prioritySuggestion, isLoading: isSuggestingPriority } = useAiSuggestion(suggestPriority, {
    onSuccess: (result) => form.setValue('priority', result.output.priority)
  });
  const { trigger: triggerLabels, data: labelsSuggestion, isLoading: isSuggestingLabels } = useAiSuggestion(suggestLabels, {
    onSuccess: (result) => {
      if (result.output.labels.length > 0) {
        const currentLabels = form.getValues('labels') || [];
        const newLabels = Array.from(new Set([...currentLabels, ...result.output.labels]));
        form.setValue('labels', newLabels);
        toast({ title: 'Labels toegevoegd!', description: `${result.output.labels.length} label(s) toegevoegd door AI.` });
      } else {
        toast({ title: 'Geen nieuwe labels gevonden.', description: 'De AI kon geen relevante nieuwe labels suggereren.' });
      }
    }
  });
  
  const title = form.watch('title');
  const description = form.watch('description');
  const debouncedTitle = useDebounce(title, 1500);
  const debouncedDescription = useDebounce(description, 1500);

  const allLabels = currentOrganization?.settings?.customization?.labels || [];
  const allPriorities = currentOrganization?.settings?.customization?.priorities?.map(p => p.name) || [];
  const showStoryPoints = currentOrganization?.settings?.features?.storyPoints !== false;

  useEffect(() => {
    if (!debouncedTitle || debouncedTitle.length < 10 || proactiveHelp || isCheckingComplexity) {
      return;
    }
    triggerProactiveHelp({ title: debouncedTitle, description: debouncedDescription });
  }, [debouncedTitle, debouncedDescription, triggerProactiveHelp, proactiveHelp, isCheckingComplexity]);

  const onCheckForDuplicates = () => {
    if (!title || !currentOrganization) return;
    triggerDuplicateCheck({
      organizationId: currentOrganization.id,
      title,
      description,
    });
  };

  const onSuggestStoryPoints = () => {
    if (!title || !currentOrganization) return toast({ title: 'Titel en organisatie zijn vereist.', variant: 'destructive' });
    triggerPoints({ title, description, organizationId: currentOrganization.id });
  };
  
  const onSuggestPriority = () => {
    if (!title) return toast({ title: 'Titel is vereist.', variant: 'destructive' });
    triggerPriority({ title, description, availablePriorities: allPriorities });
  };
  
  const onSuggestLabels = () => {
    if (!title || !currentOrganization) return toast({ title: 'Titel en organisatie zijn vereist.', variant: 'destructive' });
    triggerLabels({ title, description, organizationId: currentOrganization.id });
  };
  
  return (
    <div className="space-y-4">
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

      <FormField
        control={form.control}
        name="assigneeIds"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Toegewezen aan</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant="outline" role="combobox" className={cn("w-full justify-start", !field.value?.length && "text-muted-foreground")}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    {field.value?.length > 0
                      ? `${field.value.length} gebruiker(s) geselecteerd`
                      : 'Selecteer gebruikers'}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Zoek gebruiker..." />
                  <CommandList>
                    <CommandEmpty>Geen gebruiker gevonden.</CommandEmpty>
                    <CommandGroup>
                      {(users || []).map((user) => {
                        const isSelected = field.value?.includes(user.id);
                        return (
                          <CommandItem
                            key={user.id}
                            onSelect={() => {
                              if (isSelected) {
                                field.onChange(field.value?.filter((id) => id !== user.id));
                              } else {
                                field.onChange([...(field.value || []), user.id]);
                              }
                            }}
                          >
                            <Checkbox checked={isSelected} className="mr-2" />
                            {user.name}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="pt-1 h-fit min-h-[22px]">
              {field.value?.map((userId: string) => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;
                return (
                  <Badge variant="secondary" key={userId} className="mr-1 mb-1">
                    {user.name}
                    <button
                      type="button"
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => field.onChange(field.value?.filter((id: string) => id !== userId))}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                )
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <TaskAssignmentSuggestion />

       <FormField
        control={form.control}
        name="projectId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project</FormLabel>
            <Select onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} value={field.value || 'none'}>
              <FormControl>
                <SelectTrigger>
                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecteer een project" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">Geen project</SelectItem>
                {(projects || []).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prioriteit</FormLabel>
               <div className="flex items-center gap-2">
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger data-cy="priority-select">
                        <SelectValue placeholder="Selecteer een prioriteit" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {allPriorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Button type="button" variant="outline" size="icon" onClick={onSuggestPriority} disabled={isSuggestingPriority} aria-label="Stel prioriteit voor met AI">
                    {isSuggestingPriority ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bot className="h-4 w-4"/>}
                </Button>
              </div>
              {prioritySuggestion && (
                <Alert className="mt-2">
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>AI Suggestie: Prioriteit '{prioritySuggestion.output.priority}'</AlertTitle>
                  <AlertDescription>{prioritySuggestion.output.reasoning}</AlertDescription>
                  <AIFeedback
                    flowName="suggestPriorityFlow"
                    input={prioritySuggestion.input}
                    output={prioritySuggestion.output}
                  />
                </Alert>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {showStoryPoints && (
            <FormField
                control={form.control}
                name="storyPoints"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Story Points</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormControl>
                                <Input type="number" placeholder="bijv. 5" {...field} value={field.value ?? ''} onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)} />
                            </FormControl>
                            <Button type="button" variant="outline" size="icon" onClick={onSuggestStoryPoints} disabled={isSuggestingPoints || proactiveHelpSuggestion === 'subtasks'} aria-label="Stel Story Points voor met AI">
                                {isSuggestingPoints ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bot className="h-4 w-4"/>}
                            </Button>
                        </div>
                        {pointsSuggestion && (
                            <Alert className="mt-2">
                                <Lightbulb className="h-4 w-4" />
                                <AlertTitle>AI Suggestie: {pointsSuggestion.output.points} Story Points</AlertTitle>
                                <AlertDescription>{pointsSuggestion.output.reasoning}</AlertDescription>
                                <AIFeedback
                                    flowName="suggestStoryPointsFlow"
                                    input={pointsSuggestion.input}
                                    output={pointsSuggestion.output}
                                />
                            </Alert>
                        )}
                        <FormMessage />
                    </FormItem>
                )}
            />
        )}

      <FormField
          control={form.control}
          name="labels"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Labels</FormLabel>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-start", !field.value?.length && "text-muted-foreground")}>
                            <Tags className="mr-2 h-4 w-4" />
                            {field.value?.length > 0 ? `${field.value.length} geselecteerd` : 'Selecteer labels'}
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Zoek label..." />
                            <CommandList>
                            <CommandEmpty>Geen label gevonden.</CommandEmpty>
                            <CommandGroup>
                                {allLabels.map((label) => {
                                const isSelected = field.value?.includes(label);
                                return (
                                    <CommandItem
                                    key={label}
                                    onSelect={() => {
                                        if (isSelected) {
                                        field.onChange(field.value?.filter((l) => l !== label));
                                        } else {
                                        field.onChange([...(field.value || []), label]);
                                        }
                                    }}
                                    >
                                    <Checkbox checked={isSelected} className="mr-2"/>
                                    {label}
                                    </CommandItem>
                                );
                                })}
                            </CommandGroup>
                            </CommandList>
                        </Command>
                        </PopoverContent>
                    </Popover>
                    <Button type="button" variant="outline" size="icon" onClick={onSuggestLabels} disabled={isSuggestingLabels} aria-label="Stel labels voor met AI">
                        {isSuggestingLabels ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bot className="h-4 w-4"/>}
                    </Button>
                </div>
              <div className="pt-1 h-fit min-h-[22px]">
                {field.value?.map((label: string) => (
                  <Badge variant="secondary" key={label} className="mr-1 mb-1">
                    {label}
                    <button
                      type="button"
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => field.onChange(field.value?.filter((l: string) => l !== label))}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))}
              </div>
               {labelsSuggestion && labelsSuggestion.output.labels.length > 0 && (
                <Alert className="mt-2">
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>Voorgestelde Labels</AlertTitle>
                  <AlertDescription>De AI stelt de volgende labels voor: {labelsSuggestion.output.labels.join(', ')}</AlertDescription>
                  <AIFeedback
                    flowName="suggestLabelsFlow"
                    input={labelsSuggestion.input}
                    output={labelsSuggestion.output}
                  />
                </Alert>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
    </div>
  );
}
