

'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Trash2, Palette, Save, GripVertical, ChevronDown, Flame, Equal, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization, StatusDefinition, PriorityDefinition } from '@/lib/types';
import { PERMISSIONS, statusDefinitionSchema, priorityDefinitionSchema } from '@/lib/types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as Icons from 'lucide-react';

const workflowSchema = z.object({
  statuses: z.array(statusDefinitionSchema),
  priorities: z.array(priorityDefinitionSchema),
  labels: z.array(z.string().min(1, 'Label mag niet leeg zijn.')),
});
type WorkflowFormValues = z.infer<typeof workflowSchema>;

function DraggableItem({ item, onRemove, onUpdate, canManage, itemType }: { item: any, onRemove: (name: string) => void, onUpdate: (name: string, field: string, value: string) => void, canManage: boolean, itemType: 'status' | 'priority' }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: item.name});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const Icon = itemType === 'priority' ? (Icons[item.icon as keyof typeof Icons] || Equal) : null;
  
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-md border p-2 bg-background">
        <button type="button" {...attributes} {...listeners} className="cursor-grab p-1" disabled={!canManage}>
            <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        {Icon && <Icon className="h-4 w-4" style={{color: `hsl(${item.color})`}} />}
        <Input value={item.name} onChange={(e) => onUpdate(item.name, 'name', e.target.value)} disabled={!canManage} className="h-8 flex-1"/>
        <Input value={item.color} onChange={(e) => onUpdate(item.name, 'color', e.target.value)} disabled={!canManage} className="h-8 w-40 font-mono text-xs"/>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemove(item.name)} disabled={!canManage}>
            <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
    </div>
  );
}

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
  
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 }}));

  function handleDragEnd(event: DragEndEvent, type: 'statuses' | 'priorities') {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = (type === 'statuses' ? statusFields : priorityFields).findIndex(item => item.name === active.id);
      const newIndex = (type === 'statuses' ? statusFields : priorityFields).findIndex(item => item.name === over?.id);
      if (type === 'statuses') moveStatus(oldIndex, newIndex);
      else movePriority(oldIndex, newIndex);
    }
  }

  const handleUpdateItem = (name: string, field: string, value: string, type: 'statuses' | 'priorities') => {
    const list = type === 'statuses' ? statusFields : priorityFields;
    const updateFn = type === 'statuses' ? updateStatus : updatePriority;
    const index = list.findIndex(item => item.name === name);
    if (index !== -1) {
      const updatedItem = { ...list[index], [field]: value };
      updateFn(index, updatedItem);
    }
  };

  const handleRemoveItem = (name: string, type: 'statuses' | 'priorities') => {
    const list = type === 'statuses' ? statusFields : priorityFields;
    const removeFn = type === 'statuses' ? removeStatus : removePriority;
    const index = list.findIndex(item => item.name === name);
    if (index !== -1) {
      removeFn(index);
    }
  };

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
      form.reset(data); // Reset form state to new values
    }
    setIsSubmitting(false);
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
                 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'statuses')}>
                    <SortableContext items={statusFields.map(f => f.name)} strategy={verticalListSortingStrategy}>
                       <div className="space-y-2">
                         {statusFields.map((field, index) => (
                           <DraggableItem key={field.id} item={field} itemType="status" onRemove={(name) => handleRemoveItem(name, 'statuses')} onUpdate={(name, field, value) => handleUpdateItem(name, field, value, 'statuses')} canManage={canManageWorkflow} />
                         ))}
                       </div>
                    </SortableContext>
                </DndContext>
                <Button type="button" variant="outline" size="sm" onClick={() => handleAddItem('statuses')} disabled={!canManageWorkflow}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Status Toevoegen
                </Button>
            </div>
             <div className="space-y-2">
                <h3 className="font-medium">Prioriteiten</h3>
                 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'priorities')}>
                    <SortableContext items={priorityFields.map(f => f.name)} strategy={verticalListSortingStrategy}>
                       <div className="space-y-2">
                         {priorityFields.map((field, index) => (
                           <DraggableItem key={field.id} item={field} itemType="priority" onRemove={(name) => handleRemoveItem(name, 'priorities')} onUpdate={(name, field, value) => handleUpdateItem(name, field, value, 'priorities')} canManage={canManageWorkflow} />
                         ))}
                       </div>
                    </SortableContext>
                </DndContext>
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
