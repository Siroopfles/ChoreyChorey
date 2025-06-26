
'use client';

import { useState, type ReactNode } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { Separator } from '@/components/ui/separator';
import type { TaskTemplate, TaskTemplateFormValues } from '@/lib/types';
import { taskTemplateSchema } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Tags, Check, PlusCircle, Trash2 } from 'lucide-react';
import { Label as UiLabel } from '@/components/ui/label';

export function TemplateDialog({
  template,
  children,
}: {
  template?: TaskTemplate;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addTemplate, updateTemplate } = useTasks();
  const { currentOrganization } = useAuth();

  const allLabels = currentOrganization?.settings?.customization?.labels || [];
  const allPriorities = currentOrganization?.settings?.customization?.priorities || [];

  const form = useForm<TaskTemplateFormValues>({
    resolver: zodResolver(taskTemplateSchema),
    defaultValues: template || {
      name: '',
      title: '',
      description: '',
      priority: allPriorities[1] || 'Midden',
      labels: [],
      subtasks: [],
      storyPoints: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subtasks",
  });

  const onSubmit = async (data: TaskTemplateFormValues) => {
    try {
      if (template) {
        await updateTemplate(template.id, data);
        toast({ title: 'Gelukt!', description: `Template "${data.name}" is bijgewerkt.` });
      } else {
        await addTemplate(data);
        toast({ title: 'Gelukt!', description: `Template "${data.name}" is aangemaakt.` });
      }
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Template Bewerken' : 'Nieuw Template Aanmaken'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Naam</FormLabel>
                  <FormControl>
                    <Input placeholder="bijv. Wekelijkse Schoonmaak" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Standaard Taak Titel</FormLabel>
                  <FormControl>
                    <Input placeholder="bijv. Huis schoonmaken" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Standaard Omschrijving</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Voeg een standaard omschrijving toe..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standaard Prioriteit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allPriorities.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="storyPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standaard Story Points</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="labels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Standaard Labels</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className="w-full justify-start font-normal">
                          <Tags className="mr-2 h-4 w-4" />
                          {field.value?.length ? `${field.value.length} geselecteerd` : 'Selecteer labels'}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Zoek labels..." />
                        <CommandList>
                          <CommandEmpty>Geen labels gevonden</CommandEmpty>
                          <CommandGroup>
                            {allLabels.map((label) => (
                              <CommandItem
                                key={label}
                                onSelect={() => {
                                  const current = field.value || [];
                                  const next = current.includes(label) ? current.filter((l) => l !== label) : [...current, label];
                                  field.onChange(next);
                                }}
                              >
                                <Check className={cn('mr-2 h-4 w-4', field.value?.includes(label) ? 'opacity-100' : 'opacity-0')} />
                                {label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="pt-2">
                    {field.value?.map((label) => (
                      <Badge key={label} variant="secondary" className="mr-1">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </FormItem>
              )}
            />

             <div>
                <UiLabel>Standaard Subtaken</UiLabel>
                <div className="space-y-2 mt-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`subtasks.${index}.text`}
                        render={({ field }) => (
                            <Input {...field} placeholder="Beschrijf subtaak..."/>
                        )}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive"/>
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ text: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Subtaak toevoegen
                  </Button>
                </div>
              </div>


            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Annuleren</Button>
              </DialogClose>
              <Button type="submit">Opslaan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
