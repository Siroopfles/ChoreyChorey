
'use client';

import type { Task, TaskRelation, TaskRelationType } from '@/lib/types';
import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { useTasks } from '@/contexts/feature/task-context';
import { Button } from '@/components/ui/button';
import { Label as UiLabel } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FormField, FormControl } from '@/components/ui/form';
import { GitBranch, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { addDays, addHours } from 'date-fns';

function AddRelationPopover({ onSelect }: { onSelect: (task: Task, type: TaskRelationType) => void }) {
    const { tasks } = useTasks();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [relationType, setRelationType] = useState<TaskRelationType>('related_to');

    const availableTasks = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="w-full justify-start text-muted-foreground">
                    <LinkIcon className="mr-2 h-4 w-4"/>
                    Voeg een relatie toe...
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                <div className="p-2 border-b">
                     <Select value={relationType} onValueChange={(v) => setRelationType(v as TaskRelationType)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Relatietype..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="related_to">Gerelateerd aan</SelectItem>
                            <SelectItem value="duplicate_of">Duplicaat van</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Command>
                    <CommandInput placeholder="Zoek taak..." value={search} onValueChange={setSearch} />
                    <CommandList>
                        <CommandEmpty>Geen taken gevonden.</CommandEmpty>
                        <CommandGroup>
                            {availableTasks.slice(0, 10).map(t => (
                                <CommandItem key={t.id} onSelect={() => { onSelect(t, relationType); setOpen(false); }}>
                                    {t.title}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export function TaskFormRelations({ task: currentTask }: { task?: Task }) {
    const { control, getValues, setValue } = useFormContext();
    const { tasks } = useTasks();
    const { toast } = useToast();

    const { fields: blockedByFields, append: appendBlockedBy, remove: removeBlockedBy } = useFieldArray({ control, name: "blockedBy" });
    const { fields: relationFields, append: appendRelation, remove: removeRelation } = useFieldArray({ control, name: 'relations' });
  
    const [depPopoverOpen, setDepPopoverOpen] = useState(false);
    const [depSearch, setDepSearch] = useState('');

    const handleRemoveBlockedBy = (index: number) => {
        const blockerId = getValues(`blockedBy.${index}`);
        const currentConfig = getValues('dependencyConfig');
        if (blockerId && currentConfig && currentConfig[blockerId]) {
            const newConfig = { ...currentConfig };
            delete newConfig[blockerId];
            setValue('dependencyConfig', newConfig);
        }
        removeBlockedBy(index);
    };

    const handleAddRelation = (relatedTask: Task, type: TaskRelationType) => {
        const currentRelations = getValues('relations') || [];
        if (currentRelations.some((r: TaskRelation) => r.taskId === relatedTask.id)) {
            toast({ title: 'Taak al gekoppeld', description: 'Deze taak heeft al een relatie.', variant: 'default' });
            return;
        }
        appendRelation({ taskId: relatedTask.id, type });
    };

    const currentBlockerIds = getValues('blockedBy') || [];
    const availableTasksToBlock = tasks.filter(
        task => !currentBlockerIds.includes(task.id) && task.title.toLowerCase().includes(depSearch.toLowerCase()) && task.id !== currentTask?.id
    );

    return (
        <div className="space-y-4">
            <div>
                <UiLabel>Taak Relaties</UiLabel>
                <div className="space-y-2 mt-2">
                    {relationFields.map((field, index) => {
                        const relation = getValues(`relations.${index}`) as TaskRelation;
                        const relatedTask = tasks.find(t => t.id === relation.taskId);
                        return (
                            <div key={field.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <GitBranch className="h-4 w-4 text-muted-foreground shrink-0"/>
                                    <Badge variant="outline" className="shrink-0">{relation.type === 'related_to' ? 'Gerelateerd' : 'Duplicaat'}</Badge>
                                    <span className="truncate">{relatedTask?.title || 'Onbekende taak'}</span>
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeRelation(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        )
                    })}
                    <AddRelationPopover onSelect={handleAddRelation} />
                </div>
            </div>
            <div>
                <UiLabel>Geblokkeerd door</UiLabel>
                <div className="space-y-2 mt-2">
                    {blockedByFields.map((field, index) => {
                        const blockerId = getValues(`blockedBy.${index}`);
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
                                        control={control}
                                        name={`dependencyConfig.${blockerId}.lag`}
                                        render={({ field }) => (
                                            <Input type="number" placeholder="Wachttijd" {...field} value={field.value ?? ''} className="h-8 w-24" />
                                        )}
                                    />
                                    <FormField
                                        control={control}
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
        </div>
    );
}
