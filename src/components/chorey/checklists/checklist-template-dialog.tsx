'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ChecklistTemplate, ChecklistTemplateFormValues } from '@/lib/types';
import { checklistTemplateFormSchema } from '@/lib/types';
import { useChecklists } from '@/contexts/checklist-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';

interface ChecklistTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: ChecklistTemplate;
}

export function ChecklistTemplateDialog({ open, onOpenChange, template }: ChecklistTemplateDialogProps) {
  const { manageChecklist } = useChecklists();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChecklistTemplateFormValues>({
    resolver: zodResolver(checklistTemplateFormSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'subtasks',
  });

  useEffect(() => {
    if (open) {
      form.reset(template ? { name: template.name, subtasks: template.subtasks } : { name: '', subtasks: [] });
    }
  }, [template, open, form]);

  const onSubmit = async (data: ChecklistTemplateFormValues) => {
    setIsSubmitting(true);
    const success = await manageChecklist(template ? 'update' : 'create', data, template?.id);
    if (success) {
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{template ? 'Checklist Bewerken' : 'Nieuwe Checklist'}</DialogTitle>
          <DialogDescription>
            Maak een herbruikbare lijst van subtaken.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Naam</FormLabel><FormControl><Input placeholder="bijv. Onboarding Nieuwe Medewerker" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="space-y-2">
              <FormLabel>Subtaken</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <FormField control={form.control} name={`subtasks.${index}`} render={({ field }) => (
                    <FormItem className="flex-1"><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append('')}><PlusCircle className="mr-2 h-4 w-4" /> Subtaak toevoegen</Button>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Annuleren</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {template ? 'Opslaan' : 'Aanmaken'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
