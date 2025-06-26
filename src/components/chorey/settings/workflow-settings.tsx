
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Trash2, Palette, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const workflowSchema = z.object({
  statuses: z.array(z.string().min(1, 'Status mag niet leeg zijn.')),
  labels: z.array(z.string().min(1, 'Label mag niet leeg zijn.')),
  priorities: z.array(z.string().min(1, 'Prioriteit mag niet leeg zijn.')),
});
type WorkflowFormValues = z.infer<typeof workflowSchema>;

const ListManager = ({
  title,
  items,
  setItems,
}: {
  title: string;
  items: string[];
  setItems: (items: string[]) => void;
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
        />
        <Button type="button" onClick={handleAddItem}>
          <PlusCircle className="mr-2 h-4 w-4" /> Toevoegen
        </Button>
      </div>
    </div>
  );
};

export default function WorkflowSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowSchema),
    values: {
      statuses: organization.settings?.customization?.statuses || [],
      labels: organization.settings?.customization?.labels || [],
      priorities: organization.settings?.customization?.priorities || [],
    },
  });

  const onSubmit = async (data: WorkflowFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        customization: data
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Workflow instellingen zijn bijgewerkt.' });
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
          <ListManager
            title="Statussen"
            items={form.watch('statuses')}
            setItems={(newStatuses) => form.setValue('statuses', newStatuses, { shouldDirty: true })}
          />
          <ListManager
            title="Labels"
            items={form.watch('labels')}
            setItems={(newLabels) => form.setValue('labels', newLabels, { shouldDirty: true })}
          />
          <ListManager
            title="Prioriteiten"
            items={form.watch('priorities')}
            setItems={(newPriorities) => form.setValue('priorities', newPriorities, { shouldDirty: true })}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Instellingen Opslaan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
