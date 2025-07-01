
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save } from 'lucide-react';
import type { WidgetInstance, WidgetType } from '@/lib/types';
import { WIDGET_TYPES, widgetConfigSchemas } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/utils';

interface ManageDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightWidgetId?: string;
}

type FormValues = {
  widgets: Record<WidgetType, {
    enabled: boolean;
    config: any;
  }>;
};

export function ManageDashboardDialog({ open, onOpenChange, highlightWidgetId }: ManageDashboardDialogProps) {
  const { user, updateUserDashboard } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormValues>();

  useEffect(() => {
    if (open && user) {
      const initialFormValues: FormValues = { widgets: {} as FormValues['widgets'] };
      
      // Initialize form with all possible widgets
      for (const type in WIDGET_TYPES) {
        const widgetType = type as WidgetType;
        const existingWidget = user.dashboardConfig?.find(w => w.type === widgetType);
        
        initialFormValues.widgets[widgetType] = {
          enabled: !!existingWidget,
          config: existingWidget?.config || widgetConfigSchemas[widgetType].parse({}), // Use parse for defaults
        };
      }
      form.reset(initialFormValues);
    }
  }, [open, user, form]);
  
  const onSubmit = async (data: FormValues) => {
    if (!user) return;
    setIsSubmitting(true);

    const newDashboardConfig: WidgetInstance[] = [];
    const existingConfig = user.dashboardConfig || [];

    for (const type in data.widgets) {
      const widgetType = type as WidgetType;
      const { enabled, config } = data.widgets[widgetType];

      if (enabled) {
        const existingWidget = existingConfig.find(w => w.type === widgetType);
        const newWidgetData = {
          id: existingWidget?.id || `${widgetType}-${crypto.randomUUID()}`,
          type: widgetType,
          config: config,
        };
        // Validate the new widget data before adding it to the config
        const validation = widgetConfigSchemas[widgetType].safeParse(config);
        if (validation.success) {
           newDashboardConfig.push(newWidgetData as WidgetInstance);
        } else {
            console.error(`Invalid config for widget ${widgetType}:`, validation.error);
            toast({
                title: "Fout in widget configuratie",
                description: `De instellingen voor de widget '${WIDGET_TYPES[widgetType]}' zijn ongeldig.`,
                variant: 'destructive',
            });
        }
      }
    }
    
    await updateUserDashboard({ dashboardConfig: newDashboardConfig });
    toast({ title: "Dashboard opgeslagen!", description: "Je wijzigingen zijn succesvol opgeslagen." });
    setIsSubmitting(false);
    onOpenChange(false);
  };
  
  const renderConfigOptions = (type: WidgetType) => {
    switch (type) {
      case 'tasksByStatus':
      case 'tasksByPriority':
        return (
          <FormField
            control={form.control}
            name={`widgets.${type}.config.chartType`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grafiektype</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="pie">Taartdiagram</SelectItem>
                    <SelectItem value="bar">Staafdiagram</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        );
      case 'leaderboard':
      case 'myTasks':
         return (
          <FormField
            control={form.control}
            name={`widgets.${type}.config.limit`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aantal items</FormLabel>
                <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={String(field.value)}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dashboard Beheren</DialogTitle>
          <DialogDescription>
            Voeg widgets toe, verwijder ze, en pas hun instellingen aan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {Object.entries(WIDGET_TYPES).map(([type, label]) => {
                  const widgetType = type as WidgetType;
                  const isEnabled = form.watch(`widgets.${widgetType}.enabled`);
                  const isHighlighted = highlightWidgetId && user?.dashboardConfig?.find(w => w.id === highlightWidgetId)?.type === widgetType;

                  return (
                    <div key={type} className={cn("p-4 border rounded-lg transition-all", isHighlighted && "ring-2 ring-primary")}>
                      <FormField
                        control={form.control}
                        name={`widgets.${widgetType}.enabled`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel className="text-base font-semibold">{label}</FormLabel>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          </FormItem>
                        )}
                      />
                      {isEnabled && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                          <Label>Instellingen voor {label}</Label>
                          {renderConfigOptions(widgetType) || <p className="text-sm text-muted-foreground">Geen instellingen voor deze widget.</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <DialogFooter className="pt-6 border-t mt-6">
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Annuleren</Button>
                </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Opslaan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
