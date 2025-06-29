
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
import { User as UserIcon, Bot, Loader2, Tags, Check, X, ThumbsUp, ThumbsDown, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleSuggestStoryPoints, handleSuggestPriority, handleSuggestLabels } from '@/app/actions/ai.actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { submitAiFeedback } from '@/app/actions/feedback.actions';
import { HelpTooltip } from '@/components/ui/help-tooltip';

type TaskFormDetailsProps = {
  users: User[];
  projects: Project[];
  proactiveHelpSuggestion?: 'subtasks' | 'story_points' | 'none';
};

export function TaskFormDetails({ users, projects, proactiveHelpSuggestion }: TaskFormDetailsProps) {
  const { toast } = useToast();
  const form = useFormContext();
  const { user, currentOrganization } = useAuth();

  const allLabels = currentOrganization?.settings?.customization?.labels || [];
  const allPriorities = currentOrganization?.settings?.customization?.priorities || [];
  const showStoryPoints = currentOrganization?.settings?.features?.storyPoints !== false;

  const [isSuggestingPoints, setIsSuggestingPoints] = useState(false);
  const [pointsSuggestion, setPointsSuggestion] = useState<SuggestStoryPointsOutput | null>(null);
  const [pointsFeedbackGiven, setPointsFeedbackGiven] = useState(false);
  const [isSuggestingPriority, setIsSuggestingPriority] = useState(false);
  const [prioritySuggestion, setPrioritySuggestion] = useState<SuggestPriorityOutput | null>(null);
  const [priorityFeedbackGiven, setPriorityFeedbackGiven] = useState(false);
  const [isSuggestingLabels, setIsSuggestingLabels] = useState(false);
  
  const handleFeedback = async (flowName: string, output: any, feedback: 'positive' | 'negative') => {
    if (!user || !currentOrganization) return;
    
    if (flowName === 'suggestStoryPoints') setPointsFeedbackGiven(true);
    if (flowName === 'suggestPriority') setPriorityFeedbackGiven(true);

    await submitAiFeedback({
        flowName,
        input: { title: form.getValues('title'), description: form.getValues('description') },
        output,
        feedback,
        userId: user.id,
        organizationId: currentOrganization.id,
    });

    toast({ title: 'Feedback ontvangen!', description: 'Bedankt voor je hulp om de AI te verbeteren.' });
  };
  
  const onSuggestStoryPoints = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
     if (!title) return toast({ title: 'Titel vereist', variant: 'destructive' });
    if (!currentOrganization) return toast({ title: 'Organisatie niet gevonden', variant: 'destructive' });
    setIsSuggestingPoints(true);
    const result = await handleSuggestStoryPoints(title, currentOrganization.id, description);
    if (result.error) {
        toast({ title: 'Fout bij suggereren', description: result.error, variant: 'destructive' });
    } else if (result.suggestion) {
        form.setValue('storyPoints', result.suggestion.points);
        setPointsSuggestion(result.suggestion);
        setPointsFeedbackGiven(false);
    }
    setIsSuggestingPoints(false);
  };
  
  const onSuggestPriority = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
     if (!title) return toast({ title: 'Titel vereist', variant: 'destructive' });
    setIsSuggestingPriority(true);
    setPrioritySuggestion(null);
    const result = await handleSuggestPriority({ title, description });
    if (result.error) {
        toast({ title: 'Fout bij suggereren', description: result.error, variant: 'destructive' });
    } else if (result.suggestion) {
        form.setValue('priority', result.suggestion.priority);
        setPrioritySuggestion(result.suggestion);
        setPriorityFeedbackGiven(false);
    }
    setIsSuggestingPriority(false);
  };
  
  const onSuggestLabels = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
    if (!title) return toast({ title: 'Titel vereist', variant: 'destructive' });
    if (!currentOrganization) return toast({ title: 'Organisatie niet gevonden', variant: 'destructive' });
    setIsSuggestingLabels(true);
    const result = await handleSuggestLabels({ title, description }, currentOrganization.id);
    if (result.error) {
        toast({ title: 'Fout bij suggereren', description: result.error, variant: 'destructive' });
    } else if (result.labels) {
        const currentLabels = form.getValues('labels') || [];
        const newLabels = Array.from(new Set([...currentLabels, ...result.labels]));
        form.setValue('labels', newLabels);
        toast({ title: 'Labels voorgesteld!', description: `${result.labels.length} nieuwe label(s) voorgesteld door AI.` });
    }
    setIsSuggestingLabels(false);
  };

  return (
    <div className="space-y-4">
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
                  <AlertDescription>{prioritySuggestion.reasoning}</AlertDescription>
                  {!priorityFeedbackGiven ? (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground mr-auto">Nuttig?</p>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback('suggestPriority', prioritySuggestion, 'positive')}><ThumbsUp className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback('suggestPriority', prioritySuggestion, 'negative')}><ThumbsDown className="h-4 w-4" /></Button>
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
                                <AlertDescription>{pointsSuggestion.reasoning}</AlertDescription>
                                {!pointsFeedbackGiven ? (
                                    <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                                        <p className="text-xs text-muted-foreground mr-auto">Nuttig?</p>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback('suggestStoryPoints', pointsSuggestion, 'positive')}><ThumbsUp className="h-4 w-4" /></Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback('suggestStoryPoints', pointsSuggestion, 'negative')}><ThumbsDown className="h-4 w-4" /></Button>
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
                                    <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}/>
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
