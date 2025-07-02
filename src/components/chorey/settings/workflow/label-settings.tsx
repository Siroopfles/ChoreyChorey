'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Trash2, Save, Tags } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/core/organization.actions';
import type { Organization } from '@/lib/types';
import { PERMISSIONS } from '@/lib/types';

const formSchema = z.object({
  labels: z.array(z.string().min(1, 'Label mag niet leeg zijn.')),
});
type FormValues = z.infer<typeof formSchema>;

const ListManager = ({
  items,
  setItems,
  canManage,
}: {
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
          placeholder="Nieuw label..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); }
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

export default function LabelSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser, currentUserPermissions } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canManage = currentUserPermissions.includes(PERMISSIONS.MANAGE_WORKFLOW);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: { labels: organization.settings?.customization?.labels || [] },
  });

  const onSubmit = async (data: FormValues) => {
    if (!user || !canManage) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        customization: {
            ...(organization.settings?.customization || {}),
            labels: data.labels,
        }
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Labels opgeslagen!' });
      form.reset(data);
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Tags /> Labels</CardTitle>
          <CardDescription>Beheer de labels die beschikbaar zijn in de organisatie.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ListManager
            items={form.watch('labels')}
            setItems={(newLabels) => form.setValue('labels', newLabels, { shouldDirty: true })}
            canManage={canManage}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !form.formState.isDirty || !canManage}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Labels Opslaan
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
