
'use client';

import { useState, type ReactNode, useEffect } from 'react';
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
import { useTasks } from '@/contexts/feature/task-context';
import { useAuth } from '@/contexts/user/auth-context';
import { Separator } from '@/components/ui/separator';
import type { TaskTemplate, TaskTemplateFormValues } from '@/lib/types';
import { taskTemplateSchema } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils/utils';
import { Tags, Check, PlusCircle, Trash2, Repeat, Lock, EyeOff, Link as LinkIcon } from 'lucide-react';
import { Label as UiLabel } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TemplateDialog({
  template,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  template?: TaskTemplate;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  
  const { toast } = useToast();
  const { addTemplate, updateTemplate } = useTasks();
  const { currentOrganization } = useAuth();

  const allLabels = currentOrganization?.settings?.customization?.labels || [];
  const allPriorities = (currentOrganization?.settings?.customization?.priorities || []).map(p => p.name);

  const form = useForm<TaskTemplateFormValues>({
    resolver: zodResolver(taskTemplateSchema),
    defaultValues: template || {
      name: '',
      title: '',
      description: '',
      priority: allPriorities[1] || 'Midden',
      labels: [],
      subtasks: [],
      attachments: [],
      storyPoints: undefined,
      recurring: undefined,
      isPrivate: false,
      isSensitive: false,
    },
  });
  
  useEffect(() => {
    if (open) {
      if (template) {
        form.reset(template);
      } else {
        form.reset({
          name: '',
          title: '',
          description: '',
          priority: allPriorities[1] || 'Midden',
          labels: [],
          subtasks: [],
          attachments: [],
          storyPoints: undefined,
          recurring: undefined,
          isPrivate: false,
          isSensitive: false,
        });
      }
    }
  }, [template, open, form, allPriorities]);

  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask } = useFieldArray({
    control: form.control,
    name: "subtasks",
  });
  
  const { fields: attachmentFields, append: appendAttachment, remove: removeAttachment } = useFieldArray({
    control: form.control,
    name: "attachments",
  });

  const recurringFrequency = form.watch('recurring.frequency');
  const monthlyRecurringType = form.watch('recurring.monthly.type');

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
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Template Bewerken' : 'Nieuw Template Aanmaken'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-4">
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
                <h3 className="text-lg font-semibold">Taak Details</h3>
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
                    {subtaskFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`subtasks.${index}.text`}
                          render={({ field }) => (
                              <Input {...field} placeholder="Beschrijf subtaak..."/>
                          )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSubtask(index)}>
                          <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendSubtask({ text: '' })}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Subtaak toevoegen
                    </Button>
                  </div>
                </div>

                <div>
                    <UiLabel>Standaard Links (Bijlagen)</UiLabel>
                    <div className="space-y-2 mt-2">
                    {attachmentFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                        <FormField
                            control={form.control}
                            name={`attachments.${index}.name`}
                            render={({ field }) => (
                                <Input {...field} placeholder="Naam bijlage" className="w-1/3"/>
                            )}
                        />
                            <FormField
                            control={form.control}
                            name={`attachments.${index}.url`}
                            render={({ field }) => (
                                <Input {...field} placeholder="https://..."/>
                            )}
                        />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(index)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendAttachment({ name: '', url: '' })}>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Link toevoegen
                    </Button>
                    </div>
                </div>
                
                <Separator />
                <h3 className="text-lg font-semibold">Geavanceerde Opties</h3>
                
                <FormField
                  control={form.control}
                  name="recurring"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Herhaling</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          if (value === 'none') {
                            form.setValue('recurring', undefined);
                          } else if (value === 'monthly') {
                            form.setValue('recurring', { 
                              frequency: 'monthly',
                              monthly: { type: 'day_of_month', day: 1 }
                            });
                          } else {
                            form.setValue('recurring', { frequency: value as 'daily' | 'weekly' });
                          }
                        }}
                        value={field.value?.frequency || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <Repeat className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Niet herhalend" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Niet herhalend</SelectItem>
                          <SelectItem value="daily">Dagelijks</SelectItem>
                          <SelectItem value="weekly">Wekelijks</SelectItem>
                          <SelectItem value="monthly">Maandelijks</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {recurringFrequency === 'monthly' && (
                  <div className="pl-4 border-l-2 ml-2 space-y-4 pt-4 mt-4">
                    <FormField
                      control={form.control}
                      name="recurring.monthly.type"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Herhaal maandelijks op:</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value: "day_of_month" | "day_of_week") => {
                                if (value === 'day_of_month') {
                                  form.setValue('recurring.monthly', { type: 'day_of_month', day: 1 });
                                } else {
                                  form.setValue('recurring.monthly', { type: 'day_of_week', week: 'first', weekday: 1 });
                                }
                              }}
                              value={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="day_of_month" /></FormControl>
                                <FormLabel className="font-normal">Dag van de maand</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="day_of_week" /></FormControl>
                                <FormLabel className="font-normal">Dag van de week</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {monthlyRecurringType === 'day_of_month' && (
                      <FormField
                        control={form.control}
                        name="recurring.monthly.day"
                        render={({ field }) => (
                          <FormItem><FormLabel>Dag</FormLabel><FormControl><Input type="number" min="1" max="31" {...field} onChange={e => field.onChange(e.target.value ? +e.target.value : 1)} /></FormControl><FormMessage /></FormItem>
                        )}
                      />
                    )}
                    {monthlyRecurringType === 'day_of_week' && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="recurring.monthly.week"
                          render={({ field }) => (
                            <FormItem><FormLabel>Week</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="first">Eerste</SelectItem><SelectItem value="second">Tweede</SelectItem><SelectItem value="third">Derde</SelectItem><SelectItem value="fourth">Vierde</SelectItem><SelectItem value="last">Laatste</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="recurring.monthly.weekday"
                          render={({ field }) => (
                            <FormItem><FormLabel>Weekdag</FormLabel><Select onValueChange={value => field.onChange(parseInt(value))} value={String(field.value)}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="1">Maandag</SelectItem><SelectItem value="2">Dinsdag</SelectItem><SelectItem value="3">Woensdag</SelectItem><SelectItem value="4">Donderdag</SelectItem><SelectItem value="5">Vrijdag</SelectItem><SelectItem value="6">Zaterdag</SelectItem><SelectItem value="0">Zondag</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <FormField
                      control={form.control}
                      name="isPrivate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <FormLabel className="flex items-center gap-2"><Lock />Privé taak</FormLabel>
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isSensitive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <FormLabel className="flex items-center gap-2"><EyeOff />Gevoelige taak</FormLabel>
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                      )}
                    />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <DialogClose asChild><Button variant="ghost">Annuleren</Button></DialogClose>
              <Button type="submit">Opslaan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
