
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarClock } from 'lucide-react';
import type { ScheduledReport, ScheduledReportFormValues, ReportConfig } from '@/lib/types';
import { scheduledReportFormSchema } from '@/lib/types';
import { useTasks } from '@/contexts/feature/task-context';

interface ScheduleReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: ScheduledReport | null;
  reportConfig: ReportConfig;
}

export function ScheduleReportDialog({ open, onOpenChange, schedule, reportConfig }: ScheduleReportDialogProps) {
  const { manageScheduledReport } = useTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ScheduledReportFormValues>({
    resolver: zodResolver(scheduledReportFormSchema),
  });

  useEffect(() => {
    if (open) {
      if (schedule) {
        form.reset({
          ...schedule,
          recipients: schedule.recipients.join(', '),
        });
      } else {
        form.reset({
          name: reportConfig.name,
          recipients: '',
          schedule: 'weekly',
          reportConfig: reportConfig,
        });
      }
    }
  }, [schedule, open, form, reportConfig]);
  
  const onSubmit = async (data: ScheduledReportFormValues) => {
    setIsSubmitting(true);
    const payload = {
        ...data,
        recipients: data.recipients.split(',').map(e => e.trim()).filter(Boolean),
    };
    
    const result = await manageScheduledReport(schedule ? 'update' : 'create', payload, schedule?.id);
    
    if (!result.error) {
        toast({ title: 'Gelukt!', description: `Rapportplanning is ${schedule ? 'bijgewerkt' : 'aangemaakt'}.` });
        onOpenChange(false);
    } else {
         toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{schedule ? 'Planning Bewerken' : 'Rapport Inplannen'}</DialogTitle>
          <DialogDescription>
            Configureer de details voor het automatisch verzenden van dit rapport.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Naam Planning</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="recipients" render={({ field }) => (
                <FormItem><FormLabel>Ontvangers (e-mailadressen)</FormLabel><FormControl><Textarea placeholder="email1@voorbeeld.com, email2@voorbeeld.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="schedule" render={({ field }) => (
                <FormItem><FormLabel>Frequentie</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="daily">Dagelijks</SelectItem><SelectItem value="weekly">Wekelijks</SelectItem><SelectItem value="monthly">Maandelijks</SelectItem></SelectContent></Select><FormMessage/></FormItem>
            )}/>
             <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="ghost">Annuleren</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CalendarClock className="mr-2 h-4 w-4"/>}
                    {schedule ? 'Opslaan' : 'Inplannen'}
                </Button>
             </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
