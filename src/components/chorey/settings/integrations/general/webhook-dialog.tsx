
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/user/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { Webhook, WebhookFormValues } from '@/lib/types';
import { webhookFormSchema, WEBHOOK_EVENTS } from '@/lib/types';
import { manageWebhook } from '@/app/actions/core/webhook.actions';

interface WebhookDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  webhook: Webhook | null;
}

export function WebhookDialog({ isOpen, setIsOpen, webhook }: WebhookDialogProps) {
  const { currentOrganization, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: { name: '', url: '', events: [], enabled: true },
  });

  useEffect(() => {
    if (webhook) {
      form.reset(webhook);
    } else {
      form.reset({ name: '', url: '', events: [], enabled: true });
    }
  }, [webhook, isOpen, form]);

  const onSubmit = async (data: WebhookFormValues) => {
    if (!currentOrganization || !user) return;
    setIsSubmitting(true);
    const action = webhook ? 'update' : 'create';
    const result = await manageWebhook(action, currentOrganization.id, user.id, {
      webhookId: webhook?.id,
      data,
    });
    setIsSubmitting(false);

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Gelukt!', description: `Webhook is succesvol ${webhook ? 'bijgewerkt' : 'aangemaakt'}.` });
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{webhook ? 'Webhook Bewerken' : 'Nieuwe Webhook'}</DialogTitle>
          <DialogDescription>
            Stuur een POST-request naar een URL wanneer een gebeurtenis plaatsvindt.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naam</FormLabel>
                  <FormControl>
                    <Input placeholder="bijv. Slack Notificatie" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payload URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/webhook" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="events"
              render={() => (
                <FormItem>
                  <FormLabel>Gebeurtenissen</FormLabel>
                  <div className="space-y-2 rounded-md border p-4">
                    {Object.entries(WEBHOOK_EVENTS).map(([key, label]) => (
                      <FormField
                        key={key}
                        control={form.control}
                        name="events"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(key)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, key])
                                    : field.onChange(field.value?.filter((value) => value !== key));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{label}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel>Actief</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">Annuleren</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {webhook ? 'Opslaan' : 'Aanmaken'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
