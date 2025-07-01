
'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Trash2, Vote } from 'lucide-react';

export function TaskFormPoll() {
    const { control, watch, setValue } = useFormContext();
    const poll = watch('poll');

    const { fields, append, remove } = useFieldArray({
        control,
        name: "poll.options",
    });

    const enablePoll = () => {
        setValue('poll', {
            question: '',
            options: [{ id: crypto.randomUUID(), text: '', voterIds: [] }, { id: crypto.randomUUID(), text: '', voterIds: [] }],
            isMultiVote: false,
        });
    };

    const disablePoll = () => {
        setValue('poll', undefined);
    };

    if (!poll) {
        return (
            <Button type="button" variant="outline" onClick={enablePoll}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Voeg een Poll toe
            </Button>
        );
    }

    return (
        <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2"><Vote /> Poll Instellingen</h4>
                <Button type="button" variant="ghost" size="icon" onClick={disablePoll}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>

            <FormField
                control={control}
                name="poll.question"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Vraag</FormLabel>
                        <FormControl><Input placeholder="Wat is de beste aanpak?" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div>
                <FormLabel>Opties</FormLabel>
                <div className="space-y-2 mt-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                            <FormField
                                control={control}
                                name={`poll.options.${index}.text`}
                                render={({ field }) => (
                                    <Input {...field} placeholder={`Optie ${index + 1}`} />
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ id: crypto.randomUUID(), text: '', voterIds: [] })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Optie toevoegen
                    </Button>
                </div>
            </div>

            <FormField
                control={control}
                name="poll.isMultiVote"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <FormLabel>Sta meerdere stemmen toe</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
