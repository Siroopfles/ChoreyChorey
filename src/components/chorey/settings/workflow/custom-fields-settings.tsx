'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, PlusCircle, Trash2, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/core/organization.actions';
import type { Organization, CustomFieldDefinition } from '@/lib/types';
import { customFieldDefinitionSchema, PERMISSIONS } from '@/lib/types';

const customFieldFormSchema = customFieldDefinitionSchema.omit({ id: true });
type CustomFieldFormValues = z.infer<typeof customFieldFormSchema>;

function CustomFieldDialog({
  isOpen,
  setIsOpen,
  onSave,
}: {
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  onSave: (field: CustomFieldFormValues) => void,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<CustomFieldFormValues>({
    resolver: zodResolver(customFieldFormSchema),
    defaultValues: {
      name: '',
      type: 'text',
      options: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const fieldType = form.watch('type');

  const handleSave = (data: CustomFieldFormValues) => {
    setIsSubmitting(true);
    // Ensure options are only included for select type
    const saveData = {
        ...data,
        options: data.type === 'select' ? data.options : undefined,
    };
    onSave(saveData);
    setIsSubmitting(false);
    setIsOpen(false);
    form.reset();
  };
  
   useEffect(() => {
    if (fieldType !== 'select') {
      form.setValue('options', []);
    }
  }, [fieldType, form]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuw Eigen Veld</DialogTitle>
          <DialogDescription>Definieer een nieuw veld dat aan taken kan worden toegevoegd.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Veldnaam</FormLabel>
                  <FormControl><Input placeholder="bijv. Kosten" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Veldtype</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="text">Tekst</SelectItem>
                      <SelectItem value="number">Getal</SelectItem>
                      <SelectItem value="date">Datum</SelectItem>
                      <SelectItem value="select">Dropdown</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {fieldType === 'select' && (
              <div className="space-y-2">
                <FormLabel>Dropdown Opties</FormLabel>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`options.${index}`}
                      render={({ field }) => <Input {...field} placeholder={`Optie ${index + 1}`} />}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append('')}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Optie toevoegen
                </Button>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Annuleren</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Veld Opslaan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomFieldsSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser, currentUserPermissions } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const canManage = currentUserPermissions.includes(PERMISSIONS.MANAGE_WORKFLOW);

  const customFields = organization.settings?.customization?.customFields || [];

  const saveFields = async (updatedFields: CustomFieldDefinition[]) => {
    if (!user) return;
    const newSettings = {
      ...organization.settings,
      customization: {
        ...organization.settings?.customization,
        customFields: updatedFields,
      },
    };
    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });
    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Eigen velden zijn bijgewerkt.' });
    }
  };

  const handleAddField = (fieldData: CustomFieldFormValues) => {
    const newField: CustomFieldDefinition = {
      ...fieldData,
      id: `custom_${Date.now()}_${fieldData.name.toLowerCase().replace(/\s+/g, '_')}`,
      options: fieldData.type === 'select' ? fieldData.options : undefined,
    };
    saveFields([...customFields, newField]);
  };
  
  const handleDeleteField = (fieldId: string) => {
    const updatedFields = customFields.filter(f => f.id !== fieldId);
    saveFields(updatedFields);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 /> Eigen Velden
          </CardTitle>
          <CardDescription>
            Voeg uw eigen velden toe aan taken voor maximale flexibiliteit en maatwerk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              {customFields.length > 0 ? (
                customFields.map(field => (
                  <div key={field.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-semibold">{field.name}</p>
                      <p className="text-sm text-muted-foreground">Type: {field.type}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteField(field.id)} disabled={!canManage}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nog geen eigen velden gedefinieerd.
                </p>
              )}
            </div>
            <Button onClick={() => setIsDialogOpen(true)} disabled={!canManage}>
              <PlusCircle className="mr-2 h-4 w-4" /> Nieuw Veld Toevoegen
            </Button>
          </div>
        </CardContent>
      </Card>
      <CustomFieldDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} onSave={handleAddField} />
    </>
  );
}
