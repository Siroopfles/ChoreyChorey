'use client';

import type { User, Project, SuggestPriorityOutput, SuggestStoryPointsOutput } from '@/lib/types';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { User as UserIcon, Bot, Loader2, Tags, X, ThumbsUp, ThumbsDown, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestStoryPoints } from '@/ai/flows/suggest-story-points';
import { suggestPriority } from '@/ai/flows/suggest-priority';
import { suggestLabels } from '@/ai/flows/suggest-labels-flow';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { submitAiFeedback } from '@/app/actions/feedback.actions';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { TaskAssignmentSuggestion } from '../task-assignment-suggestion';
import { useOrganization } from '@/contexts/organization-context';

type TaskFormDetailsProps = {
  users: User[];
  projects: Project[];
  proactiveHelpSuggestion?: 'subtasks' | 'story_points' | 'none';
};

export function TaskFormDetails({ users, projects, proactiveHelpSuggestion }: TaskFormDetailsProps) {
  const { toast } = useToast();
  const form = useFormContext();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const allLabels = currentOrganization?.settings?.customization?.labels || [];
  const allPriorities = currentOrganization?.settings?.customization?.priorities?.map(p => p.name) || [];
  const showStoryPoints = currentOrganization?.settings?.features?.storyPoints !== false;

  const [isSuggestingPoints, setIsSuggestingPoints] = useState(false);
  const [pointsSuggestion, setPointsSuggestion] = useState<{ output: SuggestStoryPointsOutput, input: any } | null>(null);
  const [pointsFeedbackGiven, setPointsFeedbackGiven] = useState(false);
  const [isSuggestingPriority, setIsSuggestingPriority] = useState(false);
  const [prioritySuggestion, setPrioritySuggestion] = useState<{ output: SuggestPriorityOutput, input: any } | null>(null);
  const [priorityFeedbackGiven, setPriorityFeedbackGiven] = useState(false);
  const [isSuggestingLabels, setIsSuggestingLabels] = useState(false);
  
  const handleFeedback = async (flowName: string, output: any, input: any, feedback: 'positive' | 'negative') => {
    if (!user || !currentOrganization) return;
    
    if (flowName === 'suggestStoryPointsFlow') setPointsFeedbackGiven(true);
    if (flowName === 'suggestPriorityFlow') setPriorityFeedbackGiven(true);

    const result = await submitAiFeedback({
        flowName,
        input,
        output,
        feedback,
        userId: user.id,
        organizationId: currentOrganization.id,
    });

    if (result.data) {
        toast({ title: 'Feedback ontvangen!', description: 'Bedankt voor je hulp om de AI te verbeteren.' });
    }
  };
  
  const onSuggestStoryPoints = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
     if (!title) {
        toast({ title: 'Titel vereist', variant: 'destructive' });
        return;
    }
    if (!currentOrganization) {
        toast({ title: 'Organisatie niet gevonden', variant: 'destructive' });
        return;
    }
    setIsSuggestingPoints(true);
    setPointsSuggestion(null);
    setPointsFeedbackGiven(false);
    try {
        const result = await suggestStoryPoints(title, currentOrganization.id, description);
        form.setValue('storyPoints', result.output.points);
        setPointsSuggestion(result);
    } catch (e: any) {
        toast({ title: 'Fout bij suggereren', description: e.message, variant: 'destructive' });
    }
    setIsSuggestingPoints(false);
  };
  
  const onSuggestPriority = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
     if (!title) {
        toast({ title: 'Titel vereist', variant: 'destructive' });
        return;
    }
    setIsSuggestingPriority(true);
    setPrioritySuggestion(null);
    setPriorityFeedbackGiven(false);
    try {
        const result = await suggestPriority({ title, description, availablePriorities: allPriorities });
        form.setValue('priority', result.output.priority);
        setPrioritySuggestion(result);
    } catch(e: any) {
        toast({ title: 'Fout bij suggereren', description: e.message, variant: 'destructive' });
    }
    setIsSuggestingPriority(false);
  };
  
  const onSuggestLabels = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
    if (!title) {
        toast({ title: 'Titel vereist', variant: 'destructive' });
        return;
    }
    if (!currentOrganization) {
        toast({ title: 'Organisatie niet gevonden', variant: 'destructive' });
        return;
    }
    setIsSuggestingLabels(true);
    try {
        const result = await suggestLabels({ title, description, organizationId: currentOrganization.id });
        const currentLabels = form.getValues('labels') || [];
        const newLabels = Array.from(new Set([...currentLabels, ...result.labels]));
        form.setValue('labels', newLabels);
        toast({ title: 'Labels voorgesteld!', description: `${result.labels.length} nieuwe label(s) voorgesteld door AI.` });
    } catch (e: any) {
         toast({ title: 'Fout bij suggereren', description: e.message, variant: 'destructive' });
    }
    setIsSuggestingLabels(false);
  };

  return (
    <div className="space-y-4">
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
                    <SelectTrigger>
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
                  <AlertDescription>{prioritySuggestion.output.reasoning}</AlertDescription>
                  {!priorityFeedbackGiven ? (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground mr-auto">Nuttig?</p>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback('suggestPriorityFlow', prioritySuggestion.output, prioritySuggestion.input, 'positive')}><ThumbsUp className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback('suggestPriorityFlow', prioritySuggestion.output, prioritySuggestion.input, 'negative')}><ThumbsDown className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">Bedankt voor je feedback!</p>
                  )}
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
                                <AlertDescription>{pointsSuggestion.output.reasoning}</AlertDescription>
                                {!pointsFeedbackGiven ? (
                                    <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                                        <p className="text-xs text-muted-foreground mr-auto">Nuttig?</p>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback('suggestStoryPointsFlow', pointsSuggestion.output, pointsSuggestion.input, 'positive')}><ThumbsUp className="h-4 w-4" /></Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback('suggestStoryPointsFlow', pointsSuggestion.output, pointsSuggestion.input, 'negative')}><ThumbsDown className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">Bedankt voor je feedback!</p>
                                )}
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
              <FormMessage />
            </FormItem>
          )}
        />
    </div>
  );
}
