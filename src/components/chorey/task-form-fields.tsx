'use client';

import type { User, Label, Team } from '@/lib/types';
import { ALL_LABELS } from '@/lib/types';
import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Label as UiLabel } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, User as UserIcon, PlusCircle, Trash2, Bot, Loader2, Tags, Check, X, Repeat, Users, ImageIcon, Link as LinkIcon } from 'lucide-react';
import { TaskAssignmentSuggestion } from '@/components/chorey/task-assignment-suggestion';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { handleSuggestSubtasks, handleSuggestStoryPoints, handleGenerateTaskImage } from '@/app/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';

type TaskFormFieldsProps = {
  users: User[];
  teams: Team[];
};

export function TaskFormFields({ users, teams }: TaskFormFieldsProps) {
  const { toast } = useToast();
  const form = useFormContext();

  const [isSuggestingSubtasks, setIsSuggestingSubtasks] = useState(false);
  const [isSuggestingPoints, setIsSuggestingPoints] = useState(false);
  const [pointsSuggestion, setPointsSuggestion] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

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

  const imageDataUri = form.watch('imageDataUri');

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
        result.subtasks.forEach(subtask => appendSubtask({ text: subtask }));
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
    setIsSuggestingPoints(true);
    const result = await handleSuggestStoryPoints(title, description);
    if (result.error) {
        toast({ title: 'Fout bij suggereren', description: result.error, variant: 'destructive' });
    } else if (result.suggestion) {
        form.setValue('storyPoints', result.suggestion.points);
        setPointsSuggestion(result.suggestion.reasoning);
    }
    setIsSuggestingPoints(false);
  };

  const onGenerateImage = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
    if (!title) {
        toast({ title: 'Titel is vereist om een afbeelding te genereren.', variant: 'destructive' });
        return;
    }
    setIsGeneratingImage(true);
    try {
        const result = await handleGenerateTaskImage({ title, description });
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
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Omschrijving</FormLabel>
            <FormControl>
              <Textarea placeholder="Voeg een meer gedetailleerde omschrijving toe..." className="resize-none" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="assigneeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Toegewezen aan</FormLabel>
              <Select onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} value={field.value || 'none'}>
                <FormControl>
                  <SelectTrigger>
                    <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecteer een persoon" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Niemand</SelectItem>
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
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een prioriteit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Laag">Laag</SelectItem>
                  <SelectItem value="Midden">Midden</SelectItem>
                  <SelectItem value="Hoog">Hoog</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
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
                        {ALL_LABELS.map((label) => {
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
                        <Button type="button" variant="outline" size="icon" onClick={onSuggestStoryPoints} disabled={isSuggestingPoints}>
                            {isSuggestingPoints ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bot className="h-4 w-4"/>}
                        </Button>
                    </div>
                    {pointsSuggestion && <Alert className="mt-2"><AlertDescription>{pointsSuggestion}</AlertDescription></Alert>}
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="recurring"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Herhaling</FormLabel>
                <Select onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} value={field.value || 'none'}>
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
      </div>
      
      <FormField
        control={form.control}
        name="isPrivate"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>Privé taak</FormLabel>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <TaskAssignmentSuggestion users={users} />
      
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
        <UiLabel>Subtaken</UiLabel>
        <div className="space-y-2 mt-2">
          {subtaskFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <FormField
                control={form.control}
                name={`subtasks.${index}.text`}
                render={({ field }) => (
                    <Input {...field} placeholder="Beschrijf subtaak..."/>
                )}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSubtask(index)}>
                <Trash2 className="h-4 w-4 text-destructive"/>
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => appendSubtask({ text: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Subtaak toevoegen
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onSuggestSubtasks} disabled={isSuggestingSubtasks}>
                {isSuggestingSubtasks ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                Genereer (AI)
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <UiLabel>Links (Bijlagen)</UiLabel>
        <div className="space-y-2 mt-2">
          {attachmentFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
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
                <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(index)}>
                <Trash2 className="h-4 w-4 text-destructive"/>
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendAttachment({ name: '', url: '' })}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Link toevoegen
          </Button>
        </div>
      </div>
      
      <Separator />
      
      <div>
          <UiLabel>Geblokkeerd door (Taak ID)</UiLabel>
            <div className="space-y-2 mt-2">
            {blockedByFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <FormField
                    control={form.control}
                    name={`blockedBy.${index}`}
                    render={({ field }) => (
                        <Input {...field} value={field.value ?? ''} placeholder="Plak een taak ID..."/>
                    )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeBlockedBy(index)}>
                  <Trash2 className="h-4 w-4 text-destructive"/>
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendBlockedBy('')}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Blocker toevoegen
            </Button>
          </div>
      </div>
    </div>
  )
}
