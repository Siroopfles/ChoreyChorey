'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { useTasks } from '@/contexts/feature/task-context';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormControl } from '@/components/ui/form';
import { Label as UiLabel } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Loader2, Bot, PlusCircle, Trash2, CornerUpRight, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestSubtasks } from '@/ai/flows/assistance-suggestion/suggest-subtasks';
import { useState } from 'react';
import type { Task, Subtask } from '@/lib/types';
import { useChecklists } from '@/contexts/feature/checklist-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

export function TaskFormSubtasks({ task }: { task?: Task }) {
  const form = useFormContext();
  const { promoteSubtaskToTask } = useTasks();
  const { checklists } = useChecklists();
  const { toast } = useToast();
  const [isSuggestingSubtasks, setIsSuggestingSubtasks] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subtasks",
  });

  const onSuggestSubtasks = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
    if (!title) {
        toast({ title: 'Titel vereist', description: 'Voer een titel in om subtaken te kunnen genereren.', variant: 'destructive' });
        return;
    }
    setIsSuggestingSubtasks(true);
    try {
        const result = await suggestSubtasks({title, description});
        result.subtasks.forEach(subtask => append({ text: subtask, isPrivate: false }));
        toast({ title: 'Subtaken toegevoegd!', description: `${result.subtasks.length} subtaken zijn door AI gegenereerd.` });
    } catch(e: any) {
        toast({ title: 'Fout bij suggereren', description: e.message, variant: 'destructive' });
    }
    setIsSuggestingSubtasks(false);
  };
  
  const onInsertChecklist = (subtasks: string[]) => {
    subtasks.forEach(subtaskText => append({ text: subtaskText, isPrivate: false }));
    toast({ title: 'Checklist ingevoegd!' });
  };


  return (
    <div>
        <UiLabel>Subtaken</UiLabel>
        <div className="space-y-2 mt-2">
          {fields.map((field, index) => (
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
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Verwijder subtaak">
                    <Trash2 className="h-4 w-4 text-destructive"/>
                </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => append({ text: '', completed: false, isPrivate: false })}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Subtaak toevoegen
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onSuggestSubtasks} disabled={isSuggestingSubtasks}>
                {isSuggestingSubtasks ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4"/>}
                Suggesteer (AI)
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" disabled={checklists.length === 0}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Voeg checklist in
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput placeholder="Zoek checklist..." />
                  <CommandList>
                    <CommandEmpty>Geen checklists gevonden.</CommandEmpty>
                    <CommandGroup>
                      {checklists.map(checklist => (
                        <CommandItem key={checklist.id} onSelect={() => onInsertChecklist(checklist.subtasks)}>
                          {checklist.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
  );
}
