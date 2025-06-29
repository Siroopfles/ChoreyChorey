
'use client';

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Lock, EyeOff, HandHeart } from 'lucide-react';
import { HelpTooltip } from '@/components/ui/help-tooltip';

export function TaskFormSettings() {
    const { control } = useFormContext();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
            control={control}
            name="isPrivate"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="flex items-center">
                    <FormLabel className="flex items-center gap-2"><Lock />Privé taak</FormLabel>
                    <HelpTooltip content="Een privé taak is alleen zichtbaar voor de maker en de toegewezen personen." />
                </div>
                <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                </FormItem>
            )}
            />
            <FormField
            control={control}
            name="isSensitive"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="flex items-center">
                    <FormLabel className="flex items-center gap-2"><EyeOff />Gevoelige taak</FormLabel>
                    <HelpTooltip content="Gevoelige taken zijn alleen zichtbaar voor gebruikers met de 'Bekijk Gevoelige Data' permissie." />
                </div>
                <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                </FormItem>
            )}
            />
            <FormField
            control={control}
            name="helpNeeded"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="flex items-center">
                    <FormLabel className="flex items-center gap-2"><HandHeart />Hulp Gezocht</FormLabel>
                    <HelpTooltip content="Markeer deze taak om aan te geven dat je hulp nodig hebt. De taak verschijnt in de 'Hulp Gezocht' weergave op het dashboard." />
                </div>
                <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                </FormItem>
            )}
            />
        </div>
    );
}
