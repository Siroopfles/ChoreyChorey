
'use client';

import type { User, Project, Task } from '@/lib/types';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { TaskFormScheduling } from './TaskFormScheduling';
import { TaskFormRelations } from './TaskFormRelations';
import { TaskFormAttachments } from './TaskFormAttachments';
import { TaskFormIntegrations } from './TaskFormIntegrations';
import { TaskFormSettings } from './TaskFormSettings';
import { TaskFormRaci } from './TaskFormRaci';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { useMemo } from 'react';

type TaskFormAdvancedProps = {
  users: User[];
  projects: Project[];
  task?: Task;
};

export function TaskFormAdvanced({ users, projects, task }: TaskFormAdvancedProps) {
  const form = useFormContext();
  const { currentOrganization } = useAuth();

  const customFields = currentOrganization?.settings?.customization?.customFields || [];
  const projectId = form.watch('projectId');
  const selectedProject = useMemo(() => projects.find(p => p.id === projectId), [projectId, projects]);
  const costLabel = selectedProject?.budgetType === 'amount' ? 'Kosten (€)' : 'Geregistreerde Uren';

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

