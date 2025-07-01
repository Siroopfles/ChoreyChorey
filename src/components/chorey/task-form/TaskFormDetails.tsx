
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
import { cn } from '@/lib/utils/utils';
import { User as UserIcon, Bot, Loader2, Tags, X, Briefcase, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestStoryPoints } from '@/ai/flows/assistance-suggestion/suggest-story-points';
import { suggestPriority } from '@/ai/flows/assistance-suggestion/suggest-priority';
import { suggestLabels } from '@/ai/flows/assistance-suggestion/suggest-labels-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { TaskAssignmentSuggestion } from '@/components/chorey/common/task-assignment-suggestion';
import { useOrganization } from '@/contexts/system/organization-context';
import type { SuggestLabelsOutput } from '@/ai/schemas';
import { AIFeedback } from '@/components/chorey/common/ai-feedback';

type TaskFormDetailsProps = {
  users: User[];
  projects: Project[];
  proactiveHelpSuggestion?: 'subtasks' | 'story_points' | 'none';
};

export function TaskFormDetails({ users, projects, proactiveHelpSuggestion }: TaskFormDetailsProps) {
  const { toast } = useToast();
  const form = useFormContext();
  const { currentOrganization } = useOrganization();

  const allLabels = currentOrganization?.settings?.customization?.labels || [];
  const allPriorities = currentOrganization?.settings?.customization?.priorities?.map(p => p.name) || [];
  const showStoryPoints = currentOrganization?.settings?.features?.storyPoints !== false;

  const [isSuggestingPoints, setIsSuggestingPoints] = useState(false);
  const [pointsSuggestion, setPointsSuggestion] = useState<{ output: SuggestStoryPointsOutput, input: any } | null>(null);
  
  const [isSuggestingPriority, setIsSuggestingPriority] = useState(false);
  const [prioritySuggestion, setPrioritySuggestion] = useState<{ output: SuggestPriorityOutput, input: any } | null>(null);

  const [isSuggestingLabels, setIsSuggestingLabels] = useState(false);
  const [labelsSuggestion, setLabelsSuggestion] = useState<{ output: SuggestLabelsOutput, input: any } | null>(null);
  
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
    setLabelsSuggestion(null);
    try {
        const result = await suggestLabels({ title, description, organizationId: currentOrganization.id });
        setLabelsSuggestion(result);
        if (result.output.labels.length > 0) {
            const currentLabels = form.getValues('labels') || [];
            const newLabels = Array.from(new Set([...currentLabels, ...result.output.labels]));
            form.setValue('labels', newLabels);
            toast({ title: 'Labels toegevoegd!', description: `${result.output.labels.length} label(s) toegevoegd door AI.` });
        } else {
             toast({ title: 'Geen nieuwe labels gevonden.', description: 'De AI kon geen relevante nieuwe labels suggereren.' });
        }
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
