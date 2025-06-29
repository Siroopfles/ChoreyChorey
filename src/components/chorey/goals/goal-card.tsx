'use client';

import { useState } from 'react';
import type { PersonalGoal } from '@/lib/types';
import { useGoals } from '@/contexts/goal-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Calendar, Check, CheckCircle2, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { GoalDialog } from './goal-dialog';

export function GoalCard({ goal }: { goal: PersonalGoal }) {
  const { toggleMilestoneCompletion, deletePersonalGoal } = useGoals();
  const [isEditing, setIsEditing] = useState(false);

  const progress = goal.milestones.length > 0
    ? (goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100
    : goal.status === 'Achieved' ? 100 : 0;
    
  return (
    <>
      <Card className={cn("flex flex-col", goal.status === 'Achieved' && "border-green-500/50 bg-green-500/10")}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
              {goal.status === 'Achieved' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {goal.title}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-md hover:bg-accent -mr-2 -mt-2"><MoreVertical className="h-4 w-4" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Bewerken
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="mr-2 h-4 w-4" /> Verwijderen
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Weet je het zeker?</AlertDialogTitle><AlertDialogDescription>Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Annuleren</AlertDialogCancel><AlertDialogAction onClick={() => deletePersonalGoal(goal.id)} className="bg-destructive hover:bg-destructive/90">Verwijderen</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {goal.description && <CardDescription className="line-clamp-2">{goal.description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Voortgang</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {goal.milestones.length > 0 && (
            <Accordion type="single" collapsible>
              <AccordionItem value="milestones" className="border-none">
                <AccordionTrigger className="text-sm p-0 hover:no-underline">Mijlpalen</AccordionTrigger>
                <AccordionContent className="pt-2 space-y-2">
                  {goal.milestones.map(milestone => (
                    <div key={milestone.id} className="flex items-center gap-2">
                      <Checkbox id={milestone.id} checked={milestone.completed} onCheckedChange={() => toggleMilestoneCompletion(goal.id, milestone.id)} />
                      <label htmlFor={milestone.id} className={cn("text-sm", milestone.completed && "line-through text-muted-foreground")}>
                        {milestone.text}
                      </label>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

        </CardContent>
        <CardFooter>
          {goal.targetDate && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>Doel: {format(goal.targetDate, 'd MMMM yyyy', { locale: nl })}</span>
            </div>
          )}
        </CardFooter>
      </Card>
      {isEditing && <GoalDialog open={isEditing} onOpenChange={setIsEditing} goal={goal} />}
    </>
  );
}
