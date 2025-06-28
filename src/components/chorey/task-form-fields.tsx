

'use client';

import type { User, Project, Task, SuggestPriorityOutput } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Label as UiLabel } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, User as UserIcon, PlusCircle, Trash2, Bot, Loader2, Tags, Check, X, Repeat, Users, ImageIcon, Link as LinkIcon, AlertTriangle, Lock, Unlock, EyeOff, HandHeart, MessageSquare, Mail, Briefcase, CornerUpRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { TaskAssignmentSuggestion } from './task-assignment-suggestion';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { handleSuggestSubtasks, handleSuggestStoryPoints, handleGenerateTaskImage, handleSuggestPriority, handleIdentifyRisk, handleSuggestLabels, handleFindDuplicateTask, handleSuggestProactiveHelp } from '@/app/actions/ai.actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { RichTextEditor } from '../ui/rich-text-editor';
import { useAuth } from '@/contexts/auth-context';
import type { FindDuplicateTaskOutput, SuggestProactiveHelpOutput, SuggestStoryPointsOutput } from '@/ai/schemas';
import { GitHubLinker } from './github-linker';
import { JiraLinearLinker } from './jira-linear-linker';
import { getAttachmentSource } from '@/lib/utils';
import { AttachmentIcon } from './attachment-icons';
import { TogglProjectSelector } from './toggl-project-selector';
import { ClockifyProjectSelector } from './clockify-project-selector';
import { FigmaEmbed } from './figma-embed';
import { GoogleDocEmbed } from './google-doc-embed';
import { GitLabLinker } from './gitlab-linker';
import { BitbucketLinker } from './bitbucket-linker';
import { useDebounce } from '@/hooks/use-debounce';
import { useTasks } from '@/contexts/task-context';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { submitAiFeedback } from '@/app/actions/feedback.actions';

type TaskFormFieldsProps = {
  users: User[];
  projects: Project[];
  task?: Task;
};

export function TaskFormFields({ users, projects, task }: TaskFormFieldsProps) {
  const { toast } = useToast();
  const form = useFormContext();
  const { user, currentOrganization, teams } = useAuth();
  const { tasks, promoteSubtaskToTask } = useTasks();
  const status = form.watch('status');
  const isPrivate = form.watch('isPrivate');

  const allLabels = currentOrganization?.settings?.customization?.labels || [];
  const allPriorities = currentOrganization?.settings?.customization?.priorities || [];
  const showStoryPoints = currentOrganization?.settings?.features?.storyPoints !== false;

  const [isSuggestingSubtasks, setIsSuggestingSubtasks] = useState(false);
  const [isSuggestingPoints, setIsSuggestingPoints] = useState(false);
  const [pointsSuggestion, setPointsSuggestion] = useState<SuggestStoryPointsOutput | null>(null);
  const [pointsFeedbackGiven, setPointsFeedbackGiven] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSuggestingPriority, setIsSuggestingPriority] = useState(false);
  const [prioritySuggestion, setPrioritySuggestion] = useState<SuggestPriorityOutput | null>(null);
  const [priorityFeedbackGiven, setPriorityFeedbackGiven] = useState(false);
  const [isIdentifyingRisk, setIsIdentifyingRisk] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<{ hasRisk: boolean; riskLevel: string; analysis: string; } | null>(null);
  const [isSuggestingLabels, setIsSuggestingLabels] = useState(false);
  const [isCheckingForDuplicates, setIsCheckingForDuplicates] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<FindDuplicateTaskOutput | null>(null);
  
  const [proactiveHelp, setProactiveHelp] = useState<SuggestProactiveHelpOutput | null>(null);
  const [isCheckingComplexity, setIsCheckingComplexity] = useState(false);

  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask } = useFieldArray({
    control: form.control,
    name: "subtasks",
  });

  const { fields: attachmentFields, append: appendAttachment, remove: removeAttachment } = useFieldArray({
    control: form.control,
    name: "attachments",
  });
  
  const { fields: blockedByFields, append: appendBlockedBy, remove: removeBlockedBy } = useFieldArray({
    control: form.control,
    name: "blockedBy",
  });
  
  const [depPopoverOpen, setDepPopoverOpen] = useState(false);
  const [depSearch, setDepSearch] = useState('');

  const handleRemoveBlockedBy = (index: number) => {
    const blockerId = form.getValues(`blockedBy.${index}`);
    const currentConfig = form.getValues('dependencyConfig');
    if (blockerId && currentConfig && currentConfig[blockerId]) {
      const newConfig = { ...currentConfig };
      delete newConfig[blockerId];
      form.setValue('dependencyConfig', newConfig);
    }
    removeBlockedBy(index);
  };


  const imageDataUri = form.watch('imageDataUri');
  const recurring = form.watch('recurring');
  const recurringFrequency = recurring?.frequency;
  const monthlyRecurringType = recurring?.monthly?.type;
  
  const title = form.watch('title');
  const description = form.watch('description');
  const debouncedTitle = useDebounce(title, 1500);
  const debouncedDescription = useDebounce(description, 1500);

  const currentBlockerIds = form.watch('blockedBy') || [];
  const availableTasksToBlock = tasks.filter(
    task => !currentBlockerIds.includes(task.id) && task.title.toLowerCase().includes(depSearch.toLowerCase())
  );

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

  const handleFeedback = async (flowName: string, output: any, feedback: 'positive' | 'negative') => {
    if (!user || !currentOrganization) return;
    
    // Determine which state to update
    if (flowName === 'suggestStoryPoints') setPointsFeedbackGiven(true);
    if (flowName === 'suggestPriority') setPriorityFeedbackGiven(true);
    // ... other flows can be added here

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


  const onSuggestSubtasks = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
    if (!title) {
        toast({ title: 'Titel vereist', description: 'Voer een titel in om subtaken te kunnen genereren.', variant: 'destructive' });
        return;
    }
    setIsSuggestingSubtasks(true);
    const result = await handleSuggestSubtasks(title, description);
    if (result.error) {
        toast({ title: 'Fout bij suggereren', description: result.error, variant: 'destructive' });
    } else if (result.subtasks) {
        result.subtasks.forEach(subtask => appendSubtask({ text: subtask, isPrivate: false }));
        toast({ title: 'Subtaken toegevoegd!', description: `${result.subtasks.length} subtaken zijn door AI gegenereerd.` });
    }
    setIsSuggestingSubtasks(false);
  };
  
  const onSuggestStoryPoints = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
     if (!title) {
        toast({ title: 'Titel vereist', description: 'Voer een titel in om Story Points te kunnen genereren.', variant: 'destructive' });
        return;
    }
    if (!currentOrganization) {
        toast({ title: 'Organisatie niet gevonden', variant: 'destructive' });
        return;
    }
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
     if (!title) {
        toast({ title: 'Titel vereist', description: 'Voer een titel in om een prioriteit te kunnen genereren.', variant: 'destructive' });
        return;
    }
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
  
  const onIdentifyRisk = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
     if (!title) {
        toast({ title: 'Titel vereist', description: 'Voer een titel in om een risico-analyse te kunnen doen.', variant: 'destructive' });
        return;
    }
    setIsIdentifyingRisk(true);
    setRiskAnalysis(null);
    const result = await handleIdentifyRisk({ title, description });
    if (result.error) {
        toast({ title: 'Fout bij analyse', description: result.error, variant: 'destructive' });
    } else if (result.analysis) {
        setRiskAnalysis(result.analysis);
    }
    setIsIdentifyingRisk(false);
  };

  const onGenerateImage = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
    if (!title) {
        toast({ title: 'Titel is vereist om een afbeelding te genereren.', variant: 'destructive' });
        return;
    }
    if (!currentOrganization) {
      toast({ title: 'Organisatie niet gevonden', variant: 'destructive' });
      return;
    }
    setIsGeneratingImage(true);
    try {
        const result = await handleGenerateTaskImage({ title, description }, currentOrganization.id);
        if (result.imageDataUri) {
            form.setValue('imageDataUri', result.imageDataUri);
            toast({ title: 'Afbeelding gegenereerd en toegevoegd als omslagfoto!' });
        } else {
            throw new Error(result.error || 'Geen afbeeldingsdata ontvangen.');
        }
    } catch (error: any) {
        toast({ title: 'Fout bij genereren afbeelding', description: error.message, variant: 'destructive' });
    }
    setIsGeneratingImage(false);
  };
  
  const onSuggestLabels = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
    if (!title) {
        toast({ title: 'Titel vereist', description: 'Voer een titel in om labels te kunnen genereren.', variant: 'destructive' });
        return;
    }
    if (!currentOrganization) {
      toast({ title: 'Organisatie niet gevonden', description: 'Kan labels niet ophalen.', variant: 'destructive' });
      return;
    }
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

  const onCheckForDuplicates = async () => {
    const title = form.getValues('title');
    if (!title || !currentOrganization) {
      toast({ title: 'Titel vereist', description: 'Voer een titel in om op duplicaten te controleren.', variant: 'destructive' });
      return;
    }
    setIsCheckingForDuplicates(true);
    setDuplicateResult(null);

    const description = form.getValues('description');
    const result = await handleFindDuplicateTask({
      organizationId: currentOrganization.id,
      title,
      description
    });
    
    if (result.error) {
      toast({ title: 'Fout bij controleren', description: result.error, variant: 'destructive' });
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
        <Button type="button" variant="outline" size="sm" onClick={onCheckForDuplicates} disabled={isCheckingForDuplicates}>
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
            <div className="mt-2">
              {proactiveHelp.suggestionType === 'subtasks' && (
                <Button type="button" size="sm" onClick={onSuggestSubtasks} disabled={isSuggestingSubtasks}>
                  {isSuggestingSubtasks ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4"/>}
                  Genereer Subtaken
                </Button>
              )}
              {proactiveHelp.suggestionType === 'story_points' && (
                <Button type="button" size="sm" onClick={onSuggestStoryPoints} disabled={isSuggestingPoints}>
                  {isSuggestingPoints ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4"/>}
                  Schat Story Points
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
         <Button type="button" variant="outline" size="sm" onClick={onIdentifyRisk} disabled={isIdentifyingRisk}>
            {isIdentifyingRisk ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <AlertTriangle className="mr-2 h-4 w-4"/>}
            Analyseer Risico (AI)
        </Button>
         {riskAnalysis && (
            <Alert variant={riskAnalysis.hasRisk ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{riskAnalysis.hasRisk ? `Risico Gedetecteerd (Niveau: ${riskAnalysis.riskLevel})` : "Geen Significant Risico Gedetecteerd"}</AlertTitle>
              <AlertDescription>{riskAnalysis.analysis}</AlertDescription>
            </Alert>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="assigneeIds"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Verantwoordelijk (Responsible)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" role="combobox" className={cn("w-full justify-start", !field.value?.length && "text-muted-foreground")}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      {field.value?.length > 0 ? `${field.value.length} gebruiker(s) geselecteerd` : 'Selecteer gebruikers'}
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
                              <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}/>
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
                    const user = (users || []).find(u => u.id === userId);
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
                  {projects.map((project) => (
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
          name="teamId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team</FormLabel>
              <Select onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} value={field.value || 'none'}>
                <FormControl>
                  <SelectTrigger>
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecteer een team" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Geen team</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {status === 'In Review' && (
           <FormField
              control={form.control}
              name="reviewerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reviewer</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} value={field.value || 'none'}>
                    <FormControl>
                      <SelectTrigger>
                        <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Selecteer een reviewer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Geen reviewer</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        )}
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Einddatum</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                      {field.value ? format(field.value, 'PPP') : <span>Kies een datum</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
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
                            <Button type="button" variant="outline" size="icon" onClick={onSuggestStoryPoints} disabled={isSuggestingPoints} aria-label="Stel Story Points voor met AI">
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
        <div className="col-span-1 md:col-span-2">
           <FormField
              control={form.control}
              name="recurring"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Herhaling</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      if (value === 'none') {
                        field.onChange(undefined);
                      } else if (value === 'monthly') {
                        field.onChange({ 
                          frequency: 'monthly',
                          monthly: { type: 'day_of_month', day: 1 }
                        });
                      } else {
                        field.onChange({ frequency: value as 'daily' | 'weekly' });
                      }
                    }}
                    value={field.value?.frequency || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <Repeat className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Niet herhalend" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Niet herhalend</SelectItem>
                      <SelectItem value="daily">Dagelijks</SelectItem>
                      <SelectItem value="weekly">Wekelijks</SelectItem>
                      <SelectItem value="monthly">Maandelijks</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {recurringFrequency === 'monthly' && (
              <div className="pl-4 border-l-2 ml-2 space-y-4 pt-4 mt-4">
                <FormField
                  control={form.control}
                  name="recurring.monthly.type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Herhaal maandelijks op:</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value: "day_of_month" | "day_of_week") => {
                            if (value === 'day_of_month') {
                              form.setValue('recurring.monthly', { type: 'day_of_month', day: 1 });
                            } else {
                              form.setValue('recurring.monthly', { type: 'day_of_week', week: 'first', weekday: 1 });
                            }
                          }}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="day_of_month" />
                            </FormControl>
                            <FormLabel className="font-normal">Dag van de maand</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="day_of_week" />
                            </FormControl>
                            <FormLabel className="font-normal">Dag van de week</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {monthlyRecurringType === 'day_of_month' && (
                  <FormField
                    control={form.control}
                    name="recurring.monthly.day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dag</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="31" {...field} onChange={e => field.onChange(e.target.value ? +e.target.value : 1)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {monthlyRecurringType === 'day_of_week' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="recurring.monthly.week"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Week</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="first">Eerste</SelectItem>
                              <SelectItem value="second">Tweede</SelectItem>
                              <SelectItem value="third">Derde</SelectItem>
                              <SelectItem value="fourth">Vierde</SelectItem>
                              <SelectItem value="last">Laatste</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recurring.monthly.weekday"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weekdag</FormLabel>
                          <Select onValueChange={value => field.onChange(parseInt(value))} value={String(field.value)}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="1">Maandag</SelectItem>
                              <SelectItem value="2">Dinsdag</SelectItem>
                              <SelectItem value="3">Woensdag</SelectItem>
                              <SelectItem value="4">Donderdag</SelectItem>
                              <SelectItem value="5">Vrijdag</SelectItem>
                              <SelectItem value="6">Zaterdag</SelectItem>
                              <SelectItem value="0">Zondag</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="isPrivate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="flex items-center gap-2"><Lock />Privé taak</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isSensitive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="flex items-center gap-2"><EyeOff />Gevoelige taak</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="helpNeeded"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="flex items-center gap-2"><HandHeart />Hulp Gezocht</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <TogglProjectSelector />
      <ClockifyProjectSelector />

      <TaskAssignmentSuggestion users={users} />
      
      <Separator />

      {!isPrivate ? (
          <>
            <h3 className="text-lg font-semibold">RACI Rollen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="consultedUserIds"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Raadplegen (Consulted)</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-start", !field.value?.length && "text-muted-foreground")}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            {field.value?.length > 0 ? `${field.value.length} gebruiker(s)` : 'Selecteer gebruikers'}
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
                                    <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}/>
                                    {user.name}
                                    </CommandItem>
                                );
                                })}
                            </CommandGroup>
                            </CommandList>
                        </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="informedUserIds"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Informeren (Informed)</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-start", !field.value?.length && "text-muted-foreground")}>
                            <Mail className="mr-2 h-4 w-4" />
                            {field.value?.length > 0 ? `${field.value.length} gebruiker(s)` : 'Selecteer gebruikers'}
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
                                    <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}/>
                                    {user.name}
                                    </CommandItem>
                                );
                                })}
                            </CommandGroup>
                            </CommandList>
                        </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
          </>
      ) : (
          <Alert>
              <Lock className="h-4 w-4" />
              <AlertTitle>RACI Rollen verborgen</AlertTitle>
              <AlertDescription>
                Rollen zoals 'Geconsulteerd' en 'Geïnformeerd' zijn niet beschikbaar voor privé taken.
              </AlertDescription>
          </Alert>
      )}

      <GitHubLinker />
      <GitLabLinker />
      <BitbucketLinker />
      <JiraLinearLinker />

      <Separator />

      <div>
        <UiLabel>Omslagfoto</UiLabel>
        <div className="space-y-2 mt-2">
          {imageDataUri && (
            <div className="relative aspect-video w-full max-w-sm rounded-md border overflow-hidden">
              <Image src={imageDataUri} alt="Omslagfoto preview" layout="fill" objectFit="cover" />
              <Button 
                type="button" 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => form.setValue('imageDataUri', undefined)}
                aria-label="Verwijder omslagfoto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={onGenerateImage} disabled={isGeneratingImage}>
            {isGeneratingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
            Genereer Omslagfoto (AI)
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <UiLabel>Bijlagen</UiLabel>
        <div className="space-y-2 mt-2">
          {attachmentFields.map((field, index) => {
             const urlValue = form.watch(`attachments.${index}.url`);
             const source = getAttachmentSource(urlValue);
             const isEmbeddable = source.startsWith('google-') || source === 'figma';
             return (
                <div key={field.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-muted rounded-md">
                            <AttachmentIcon source={source} />
                        </div>
                        <FormField
                            control={form.control}
                            name={`attachments.${index}.name`}
                            render={({ field }) => (
                                <Input {...field} placeholder="Naam bijlage" className="w-1/3"/>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`attachments.${index}.url`}
                            render={({ field }) => (
                                <Input {...field} placeholder="https://..."/>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(index)} aria-label="Verwijder bijlage">
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                    </div>
                    {isEmbeddable && urlValue && source === 'figma' && <FigmaEmbed url={urlValue} />}
                    {isEmbeddable && urlValue && source.startsWith('google-') && <GoogleDocEmbed url={urlValue} />}
                </div>
             )
          })}
          <Button type="button" variant="outline" size="sm" onClick={() => appendAttachment({ name: '', url: '' })}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Bijlage toevoegen
          </Button>
        </div>
      </div>
      
      <Separator />
      
      <div>
          <UiLabel>Geblokkeerd door</UiLabel>
            <div className="space-y-2 mt-2">
            {blockedByFields.map((field, index) => {
              const blockerId = form.watch(`blockedBy.${index}`);
              const blockerTask = tasks.find(t => t.id === blockerId);
              return (
                <div key={field.id} className="flex flex-col gap-2 rounded-md border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {blockerTask ? blockerTask.title : <span className="text-muted-foreground italic">Taak niet gevonden</span>}
                    </p>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveBlockedBy(index)} aria-label="Verwijder blokkering">
                      <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                  </div>
                   {blockerId && <div className="flex items-center gap-2 pl-1">
                      <FormField
                          control={form.control}
                          name={`dependencyConfig.${blockerId}.lag`}
                          render={({ field }) => (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Input type="number" placeholder="Wachttijd" {...field} value={field.value ?? ''} className="h-8 w-24" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Wachttijd na voltooiing van de blokkerende taak.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name={`dependencyConfig.${blockerId}.unit`}
                          render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value || 'days'}>
                                  <FormControl>
                                      <SelectTrigger className="h-8 w-28">
                                          <SelectValue/>
                                      </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      <SelectItem value="days">Dagen</SelectItem>
                                      <SelectItem value="hours">Uren</SelectItem>
                                  </SelectContent>
                              </Select>
                          )}
                      />
                  </div>}
                </div>
              )
            })}
             <Popover open={depPopoverOpen} onOpenChange={setDepPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="w-full justify-start">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Blocker toevoegen...
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                    <Command>
                        <CommandInput 
                            placeholder="Zoek taak op naam..." 
                            value={depSearch}
                            onValueChange={setDepSearch}
                        />
                        <CommandList>
                            <CommandEmpty>Geen taken gevonden.</CommandEmpty>
                            <CommandGroup>
                                {availableTasksToBlock.map(task => (
                                    <CommandItem
                                        key={task.id}
                                        value={task.title}
                                        onSelect={() => {
                                            appendBlockedBy(task.id);
                                            setDepPopoverOpen(false);
                                            setDepSearch('');
                                        }}
                                    >
                                        {task.title}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
          </div>
      </div>
      
       <Separator />

      <div>
        <UiLabel>Subtaken</UiLabel>
        <div className="space-y-2 mt-2">
          {subtaskFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
                <FormField
                    control={form.control}
                    name={`subtasks.${index}.isPrivate`}
                    render={({ field }) => (
                        <FormItem>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="data-[state=checked]:bg-yellow-500"
                                                aria-label="Markeer subtaak als privé"
                                            />
                                        </FormControl>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Markeer als privé subtaak</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={`subtasks.${index}.text`}
                    render={({ field }) => (
                        <Input {...field} placeholder="Beschrijf subtaak..."/>
                    )}
                />
                {task && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const subtask = task.subtasks[index];
                      if (task && subtask) {
                        promoteSubtaskToTask(task.id, subtask);
                      }
                    }}
                    aria-label="Promoveer subtaak naar nieuwe taak"
                  >
                    <CornerUpRight className="h-4 w-4" />
                  </Button>
                )}
                <Button type="button" variant="ghost" size="icon" onClick={() => removeSubtask(index)} aria-label="Verwijder subtaak">
                    <Trash2 className="h-4 w-4 text-destructive"/>
                </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={onSuggestSubtasks} disabled={isSuggestingSubtasks}>
            {isSuggestingSubtasks ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4"/>}
            Suggesteer subtaken (AI)
          </Button>
        </div>
      </div>
    </div>
  );
}
