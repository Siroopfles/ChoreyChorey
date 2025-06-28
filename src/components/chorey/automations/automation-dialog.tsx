
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Zap } from 'lucide-react';
import type { Automation, AutomationFormValues } from '@/lib/types';
import { automationFormSchema, AUTOMATION_TRIGGER_TYPES, AUTOMATION_ACTION_TYPES } from '@/lib/types';

interface AutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation?: Automation;
}

export function AutomationDialog({ open, onOpenChange, automation }: AutomationDialogProps) {
  const { manageAutomation } = useTasks();
  const { users, currentOrganization } = useAuth();
  const allPriorities = currentOrganization?.settings?.customization?.priorities || [];
  const allLabels = currentOrganization?.settings?.customization?.labels || [];
  const allStatuses = currentOrganization?.settings?.customization?.statuses || [];
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AutomationFormValues>({
    resolver: zodResolver(automationFormSchema),
  });

  useEffect(() => {
    if (automation) {
      form.reset(automation);
    } else {
      form.reset({
        name: '',
        enabled: true,
        trigger: { type: 'task.created' },
        action: { type: 'task.assign', params: {} },
      });
    }
  }, [automation, open, form]);
  
  const triggerType = form.watch('trigger.type');
  const actionType = form.watch('action.type');

  const onSubmit = async (data: AutomationFormValues) => {
    setIsSubmitting(true);
    const result = await manageAutomation(automation ? 'update' : 'create', data, automation);
    if (result.success) {
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{automation ? 'Automatisering Bewerken' : 'Nieuwe Automatisering'}</DialogTitle>
          <DialogDescription>Creëer een 'Als dit, dan dat' regel voor uw taken.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Naam</FormLabel><FormControl><Input placeholder="bijv. Wijs 'Bug' taken toe aan QA Team" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="enabled" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><FormLabel>Ingeschakeld</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
             )} />
            
            <div className="p-4 border rounded-md space-y-4 bg-muted/50">
                <h3 className="font-semibold text-muted-foreground">WANNEER (Trigger)...</h3>
                 <FormField
                    control={form.control}
                    name="trigger.type"
                    render={({ field }) => (
                        <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                    {Object.entries(AUTOMATION_TRIGGER_TYPES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {triggerType === 'task.created' && (
                    <div className="pl-4 border-l-2 ml-2 space-y-4 pt-4">
                        <h4 className="text-sm font-semibold">Alleen als... (optionele filters)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="trigger.filters.priority" render={({ field }) => (
                                <FormItem><FormLabel>Prioriteit is</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Elke prioriteit"/></SelectTrigger></FormControl><SelectContent>{allPriorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>
                            )}/>
                            <FormField control={form.control} name="trigger.filters.label" render={({ field }) => (
                                <FormItem><FormLabel>Label is</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Elk label"/></SelectTrigger></FormControl><SelectContent>{allLabels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>
                            )}/>
                        </div>
                    </div>
                )}
                {triggerType === 'task.status.changed' && (
                    <div className="pl-4 border-l-2 ml-2 space-y-4 pt-4">
                        <h4 className="text-sm font-semibold">Alleen als... (optionele filters)</h4>
                        <FormField control={form.control} name="trigger.filters.status" render={({ field }) => (
                            <FormItem><FormLabel>Status verandert naar</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Elke status"/></SelectTrigger></FormControl><SelectContent>{allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>
                        )}/>
                    </div>
                )}
                {triggerType === 'task.priority.changed' && (
                    <div className="pl-4 border-l-2 ml-2 space-y-4 pt-4">
                        <h4 className="text-sm font-semibold">Alleen als... (optionele filters)</h4>
                        <FormField control={form.control} name="trigger.filters.priority" render={({ field }) => (
                            <FormItem><FormLabel>Prioriteit verandert naar</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Elke prioriteit"/></SelectTrigger></FormControl><SelectContent>{allPriorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>
                        )}/>
                    </div>
                )}
            </div>

             <div className="p-4 border rounded-md space-y-4 bg-muted/50">
                <h3 className="font-semibold text-muted-foreground">DOE DAN DIT (Actie)...</h3>
                <FormField
                    control={form.control}
                    name="action.type"
                    render={({ field }) => (
                        <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                    {Object.entries(AUTOMATION_ACTION_TYPES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 {actionType === 'task.assign' && (
                    <div className="pl-4 border-l-2 ml-2 space-y-4 pt-4">
                        <FormField control={form.control} name="action.params.assigneeId" render={({ field }) => (
                            <FormItem><FormLabel>Wijs toe aan</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Kies een gebruiker..."/></SelectTrigger></FormControl><SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>
                        )}/>
                    </div>
                 )}
                 {actionType === 'task.set.priority' && (
                    <div className="pl-4 border-l-2 ml-2 space-y-4 pt-4">
                        <FormField control={form.control} name="action.params.priority" render={({ field }) => (
                            <FormItem><FormLabel>Stel prioriteit in op</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Kies een prioriteit..."/></SelectTrigger></FormControl><SelectContent>{allPriorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>
                        )}/>
                    </div>
                )}
                {actionType === 'task.add.label' && (
                    <div className="pl-4 border-l-2 ml-2 space-y-4 pt-4">
                        <FormField control={form.control} name="action.params.label" render={({ field }) => (
                            <FormItem><FormLabel>Voeg label toe</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Kies een label..."/></SelectTrigger></FormControl><SelectContent>{allLabels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>
                        )}/>
                    </div>
                )}
            </div>

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Annuleren</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                {automation ? 'Automatisering Opslaan' : 'Automatisering Aanmaken'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
