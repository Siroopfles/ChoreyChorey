'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Trash2, Save, Workflow } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/core/organization.actions';
import type { Organization, StatusDefinition } from '@/lib/types';
import { statusDefinitionSchema, PERMISSIONS } from '@/lib/types';
import { DraggableList } from '../general/DraggableList';

const formSchema = z.object({
  statuses: z.array(statusDefinitionSchema),
});
type FormValues = z.infer<typeof formSchema>;

export default function StatusSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser, currentUserPermissions } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canManage = currentUserPermissions.includes(PERMISSIONS.MANAGE_WORKFLOW);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: { statuses: organization.settings?.customization?.statuses || [] },
  });

  const { fields, append, remove, move, update } = useFieldArray({
    control: form.control,
    name: "statuses"
  });

  const onSubmit = async (data: FormValues) => {
    if (!user || !canManage) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        customization: {
            ...(organization.settings?.customization || {}),
            statuses: data.statuses,
        }
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Statussen opgeslagen!' });
      form.reset(data); // Reset to new state to clear dirty state
    }
    setIsSubmitting(false);
  };

  const renderItem = (item: { id: string } & StatusDefinition, index: number) => (
    <div className="flex items-center gap-2 rounded-md border p-2 bg-background w-full">
        <div className="h-5 w-5 rounded-sm" style={{ backgroundColor: `hsl(${item.color})` }} />
        <Input defaultValue={item.name} onChange={(e) => update(index, { ...item, name: e.target.value })} disabled={!canManage} className="h-8 flex-1"/>
        <Input defaultValue={item.color} onChange={(e) => update(index, { ...item, color: e.target.value })} disabled={!canManage} className="h-8 w-40 font-mono text-xs"/>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(index)} disabled={!canManage}>
            <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
    </div>
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Workflow /> Statussen</CardTitle>
          <CardDescription>
            Beheer de statussen van uw workflow. De volgorde hier bepaalt de volgorde van de kolommen op het Kanbanbord.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DraggableList items={fields} onMove={move} renderItem={renderItem} disabled={!canManage} />
          <Button type="button" variant="outline" size="sm" onClick={() => append({ name: 'Nieuwe Status', color: '220 13% 69%' })} disabled={!canManage}>
            <PlusCircle className="mr-2 h-4 w-4" /> Status Toevoegen
          </Button>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !form.formState.isDirty || !canManage}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Statussen Opslaan
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
