'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Trash2, Save, ArrowUpNarrowWide, Equal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/core/organization.actions';
import type { Organization, PriorityDefinition } from '@/lib/types';
import { priorityDefinitionSchema, PERMISSIONS } from '@/lib/types';
import * as Icons from 'lucide-react';
import { DraggableList } from '../general/DraggableList';

const formSchema = z.object({
  priorities: z.array(priorityDefinitionSchema),
});
type FormValues = z.infer<typeof formSchema>;

export default function PrioritySettings({ organization }: { organization: Organization }) {
  const { user, refreshUser, currentUserPermissions } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canManage = currentUserPermissions.includes(PERMISSIONS.MANAGE_WORKFLOW);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: { priorities: organization.settings?.customization?.priorities || [] },
  });

  const { fields, append, remove, move, update } = useFieldArray({
    control: form.control,
    name: "priorities"
  });

  const onSubmit = async (data: FormValues) => {
    if (!user || !canManage) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        customization: {
            ...(organization.settings?.customization || {}),
            priorities: data.priorities,
        }
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Prioriteiten opgeslagen!' });
      form.reset(data);
    }
    setIsSubmitting(false);
  };

  const renderItem = (item: { id: string } & PriorityDefinition, index: number) => {
    const Icon = Icons[item.icon as keyof typeof Icons] || Equal;
    return (
        <div className="flex items-center gap-2 rounded-md border p-2 bg-background w-full">
            <Icon className="h-4 w-4" style={{color: `hsl(${item.color})`}} />
            <Input defaultValue={item.name} onChange={(e) => update(index, { ...item, name: e.target.value })} disabled={!canManage} className="h-8 flex-1"/>
            <Input defaultValue={item.color} onChange={(e) => update(index, { ...item, color: e.target.value })} disabled={!canManage} className="h-8 w-40 font-mono text-xs"/>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(index)} disabled={!canManage}>
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
        </div>
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ArrowUpNarrowWide /> Prioriteiten</CardTitle>
          <CardDescription>Beheer de prioriteitsniveaus. Sleep om de volgorde aan te passen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DraggableList items={fields} onMove={move} renderItem={renderItem} disabled={!canManage} />
          <Button type="button" variant="outline" size="sm" onClick={() => append({ name: 'Nieuwe Prioriteit', color: '47.9 95.8% 53.1%', icon: 'Equal' })} disabled={!canManage}>
            <PlusCircle className="mr-2 h-4 w-4" /> Prioriteit Toevoegen
          </Button>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !form.formState.isDirty || !canManage}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Prioriteiten Opslaan
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
