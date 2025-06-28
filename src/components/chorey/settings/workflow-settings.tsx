
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Trash2, Palette, Save, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization } from '@/lib/types';
import { PERMISSIONS } from '@/lib/types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const workflowSchema = z.object({
  statuses: z.array(z.string().min(1, 'Status mag niet leeg zijn.')),
  labels: z.array(z.string().min(1, 'Label mag niet leeg zijn.')),
  priorities: z.array(z.string().min(1, 'Prioriteit mag niet leeg zijn.')),
});
type WorkflowFormValues = z.infer<typeof workflowSchema>;

function SortableStatusItem({ id, onRemove, canManage }: { id: string, onRemove: (id: string) => void, canManage: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between gap-2 rounded-md border p-2 bg-background">
      <div className="flex items-center gap-2">
        <button type="button" {...attributes} {...listeners} className="cursor-grab p-1" disabled={!canManage}>
            <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <span>{id}</span>
      </div>
      <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onRemove(id)}
          disabled={!canManage}
        >
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
  const initialStatuses = organization.settings?.customization?.statuses || [];
  const [statuses, setStatuses] = useState(initialStatuses);
  const [newStatus, setNewStatus] = useState('');
  
  const sensors = useSensors(useSensor(PointerSensor));

  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowSchema),
    values: {
      statuses: initialStatuses,
      labels: organization.settings?.customization?.labels || [],
      priorities: organization.settings?.customization?.priorities || [],
    },
  });
  
  function handleDragEnd(event: any) {
    const {active, over} = event;
    if (active.id !== over.id) {
      const oldIndex = statuses.indexOf(active.id);
      const newIndex = statuses.indexOf(over.id);
      const newStatuses = arrayMove(statuses, oldIndex, newIndex);
      setStatuses(newStatuses);
      form.setValue('statuses', newStatuses, { shouldDirty: true });
    }
  }

  const handleAddStatus = () => {
    if (newStatus.trim() && !statuses.includes(newStatus.trim())) {
      const newStatuses = [...statuses, newStatus.trim()];
      setStatuses(newStatuses);
      form.setValue('statuses', newStatuses, { shouldDirty: true });
      setNewStatus('');
    }
  };

  const handleRemoveStatus = (statusToRemove: string) => {
    const newStatuses = statuses.filter(s => s !== statusToRemove);
    setStatuses(newStatuses);
    form.setValue('statuses', newStatuses, { shouldDirty: true });
  };


  const onSubmit = async (data: WorkflowFormValues) => {
    if (!user || !canManageWorkflow) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        customization: {
            ...organization.settings?.customization,
            ...data,
            statuses: statuses,
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
          Pas statussen, labels en prioriteiten aan om bij de workflow van uw organisatie te passen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <h3 className="font-medium">Statussen (Sleep om te sorteren)</h3>
                <div className="space-y-2">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={statuses} strategy={verticalListSortingStrategy}>
                            {statuses.map(status => <SortableStatusItem key={status} id={status} onRemove={handleRemoveStatus} canManage={canManageWorkflow} />)}
                        </SortableContext>
                    </DndContext>
                </div>
                 <div className="flex items-center gap-2">
                    <Input
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        placeholder="Nieuwe status..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddStatus();
                            }
                        }}
                        disabled={!canManageWorkflow}
                        />
                    <Button type="button" onClick={handleAddStatus} disabled={!canManageWorkflow}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Toevoegen
                    </Button>
                </div>
            </div>
          <ListManager
            title="Labels"
            items={form.watch('labels')}
            setItems={(newLabels) => form.setValue('labels', newLabels, { shouldDirty: true })}
            canManage={canManageWorkflow}
          />
          <ListManager
            title="Prioriteiten"
            items={form.watch('priorities')}
            setItems={(newPriorities) => form.setValue('priorities', newPriorities, { shouldDirty: true })}
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
