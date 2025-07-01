
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Trash2, Palette, Save, Equal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/core/organization.actions';
import type { Organization, StatusDefinition, PriorityDefinition } from '@/lib/types';
import { PERMISSIONS, statusDefinitionSchema, priorityDefinitionSchema } from '@/lib/types';
import * as Icons from 'lucide-react';
import { DraggableList } from './DraggableList';

const workflowSchema = z.object({
  statuses: z.array(statusDefinitionSchema),
  priorities: z.array(priorityDefinitionSchema),
  labels: z.array(z.string().min(1, 'Label mag niet leeg zijn.')),
});
type WorkflowFormValues = z.infer<typeof workflowSchema>;

const ListManager = ({
  title,
  items,
  setItems,
  canManage,
}: {
  title: string;
  items: string[];
  setItems: (items: string[]) => void;
  canManage: boolean;
}) => {
  const [newItem, setNewItem] = useState('');

  const handleAddItem = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (itemToRemove: string) => {
    setItems(items.filter(item => item !== itemToRemove));
  };

  return (
    <div className="space-y-2">
      <h3 className="font-medium">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center justify-between gap-2 rounded-md border p-2">
            <span>{item}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleRemoveItem(item)}
              disabled={!canManage}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={`Nieuwe ${title.toLowerCase().slice(0, -1)}...`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddItem();
            }
          }}
          disabled={!canManage}
        />
        <Button type="button" onClick={handleAddItem} disabled={!canManage}>
          <PlusCircle className="mr-2 h-4 w-4" /> Toevoegen
        </Button>
      </div>
    </div>
  );
};

export default function WorkflowSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser, currentUserPermissions } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const canManageWorkflow = currentUserPermissions.includes(PERMISSIONS.MANAGE_ORGANIZATION);

  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      statuses: organization.settings?.customization?.statuses || [],
      priorities: organization.settings?.customization?.priorities || [],
      labels: organization.settings?.customization?.labels || [],
    },
  });

  const { fields: statusFields, append: appendStatus, remove: removeStatus, move: moveStatus, update: updateStatus } = useFieldArray({ control: form.control, name: "statuses" });
  const { fields: priorityFields, append: appendPriority, remove: removePriority, move: movePriority, update: updatePriority } = useFieldArray({ control: form.control, name: "priorities" });
  
  const handleAddItem = (type: 'statuses' | 'priorities') => {
    if (type === 'statuses') {
        appendStatus({ name: 'Nieuwe Status', color: '220 13% 69%' });
    } else {
        appendPriority({ name: 'Nieuwe Prioriteit', color: '47.9 95.8% 53.1%', icon: 'Equal' });
    }
  };

  const onSubmit = async (data: WorkflowFormValues) => {
    if (!user || !canManageWorkflow) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        customization: {
            ...organization.settings?.customization,
            ...data
        }
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Workflow instellingen zijn bijgewerkt.' });
      form.reset(data);
    }
    setIsSubmitting(false);
  };

  const renderStatusItem = (item: StatusDefinition, index: number) => {
    return (
        <div className="flex items-center gap-2 rounded-md border p-2 bg-background w-full">
            <Input defaultValue={item.name} onChange={(e) => updateStatus(index, { ...item, name: e.target.value })} disabled={!canManageWorkflow} className="h-8 flex-1"/>
            <Input defaultValue={item.color} onChange={(e) => updateStatus(index, { ...item, color: e.target.value })} disabled={!canManageWorkflow} className="h-8 w-40 font-mono text-xs"/>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeStatus(index)} disabled={!canManageWorkflow}>
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
        </div>
    );
  };

  const renderPriorityItem = (item: PriorityDefinition, index: number) => {
    const Icon = Icons[item.icon as keyof typeof Icons] || Equal;
    return (
        <div className="flex items-center gap-2 rounded-md border p-2 bg-background w-full">
            <Icon className="h-4 w-4" style={{color: `hsl(${item.color})`}} />
            <Input defaultValue={item.name} onChange={(e) => updatePriority(index, { ...item, name: e.target.value })} disabled={!canManageWorkflow} className="h-8 flex-1"/>
            <Input defaultValue={item.color} onChange={(e) => updatePriority(index, { ...item, color: e.target.value })} disabled={!canManageWorkflow} className="h-8 w-40 font-mono text-xs"/>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removePriority(index)} disabled={!canManageWorkflow}>
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
        </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette /> Workflow Aanpassing
        </CardTitle>
        <CardDescription>
          Pas statussen, labels en prioriteiten aan om bij de workflow van uw organisatie te passen. Sleep statussen om de volgorde op het bord aan te passen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <h3 className="font-medium">Statussen</h3>
                <DraggableList items={statusFields} onMove={moveStatus} renderItem={renderStatusItem} />
                <Button type="button" variant="outline" size="sm" onClick={() => handleAddItem('statuses')} disabled={!canManageWorkflow}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Status Toevoegen
                </Button>
            </div>
             <div className="space-y-2">
                <h3 className="font-medium">Prioriteiten</h3>
                <DraggableList items={priorityFields} onMove={movePriority} renderItem={renderPriorityItem} />
                <Button type="button" variant="outline" size="sm" onClick={() => handleAddItem('priorities')} disabled={!canManageWorkflow}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Prioriteit Toevoegen
                </Button>
            </div>
          <ListManager
            title="Labels"
            items={form.watch('labels')}
            setItems={(newLabels) => form.setValue('labels', newLabels, { shouldDirty: true })}
            canManage={canManageWorkflow}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !form.formState.isDirty || !canManageWorkflow}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Instellingen Opslaan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
