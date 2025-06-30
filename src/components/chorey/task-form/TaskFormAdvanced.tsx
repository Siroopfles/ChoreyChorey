
'use client';

import type { User, Project, Task } from '@/lib/types';
import { useFormContext } from 'react-hook-form';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { TaskFormScheduling } from './TaskFormScheduling';
import { TaskFormRelations } from './TaskFormRelations';
import { TaskFormAttachments } from './TaskFormAttachments';
import { TaskFormIntegrations } from './TaskFormIntegrations';
import { TaskFormSettings } from './TaskFormSettings';
import { TaskFormRaci } from './TaskFormRaci';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useOrganization } from '@/contexts/organization-context';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskFormPoll } from './TaskFormPoll';


type TaskFormAdvancedProps = {
  users: User[];
  projects: Project[];
  task?: Task;
};

export function TaskFormAdvanced({ users, projects, task }: TaskFormAdvancedProps) {
  const form = useFormContext();
  const { currentOrganization } = useOrganization();

  const customFields = currentOrganization?.settings?.customization?.customFields || [];

  return (
    <Accordion type="multiple" className="w-full space-y-2">
      <AccordionItem value="scheduling">
        <AccordionTrigger className="text-sm font-semibold">Planning & Herhaling</AccordionTrigger>
        <AccordionContent className="pt-2 space-y-4">
          <TaskFormScheduling />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="relations">
        <AccordionTrigger className="text-sm font-semibold">Relaties & Blokkeringen</AccordionTrigger>
        <AccordionContent className="pt-2 space-y-4">
          <TaskFormRelations task={task} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="poll">
        <AccordionTrigger className="text-sm font-semibold">Poll</AccordionTrigger>
        <AccordionContent className="pt-2 space-y-4">
          <TaskFormPoll />
        </AccordionContent>
      </AccordionItem>

       <AccordionItem value="raci">
        <AccordionTrigger className="text-sm font-semibold">RACI & Betrokkenen</AccordionTrigger>
        <AccordionContent className="pt-2 space-y-4">
            <TaskFormRaci users={users} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="attachments">
        <AccordionTrigger className="text-sm font-semibold">Bijlagen & Omslagfoto</AccordionTrigger>
        <AccordionContent className="pt-2 space-y-4">
          <TaskFormAttachments />
        </AccordionContent>
      </AccordionItem>
      
      {customFields.length > 0 && (
        <AccordionItem value="custom-fields">
            <AccordionTrigger className="text-sm font-semibold">Eigen Velden</AccordionTrigger>
            <AccordionContent className="pt-2 space-y-4">
            {customFields.map((fieldDef) => {
                const fieldName = `customFieldValues.${fieldDef.id}`;
                
                switch (fieldDef.type) {
                case 'text':
                    return (
                    <FormField
                        key={fieldDef.id}
                        control={form.control}
                        name={fieldName}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{fieldDef.name}</FormLabel>
                            <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    );
                case 'number':
                    return (
                    <FormField
                        key={fieldDef.id}
                        control={form.control}
                        name={fieldName}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{fieldDef.name}</FormLabel>
                            <FormControl>
                               <Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    );
                case 'date':
                    return (
                        <FormField
                            key={fieldDef.id}
                            control={form.control}
                            name={fieldName}
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>{fieldDef.name}</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button variant={'outline'} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(new Date(field.value), 'PPP') : <span>Kies een datum</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    );
                case 'select':
                    return (
                        <FormField
                            key={fieldDef.id}
                            control={form.control}
                            name={fieldName}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{fieldDef.name}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={`Selecteer een ${fieldDef.name}`} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(fieldDef.options || []).map(option => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    );
                default:
                    return null;
                }
            })}
            </AccordionContent>
        </AccordionItem>
      )}

      <AccordionItem value="integrations">
        <AccordionTrigger className="text-sm font-semibold">Integraties</AccordionTrigger>
        <AccordionContent className="pt-2 space-y-4">
           <TaskFormIntegrations />
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="settings">
        <AccordionTrigger className="text-sm font-semibold">Taakinstellingen</AccordionTrigger>
        <AccordionContent className="pt-2 space-y-4">
          <TaskFormSettings />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
