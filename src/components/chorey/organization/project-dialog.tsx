
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, Check, Users, X, Euro, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/core/firebase';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import type { Project, Team } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/user/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { HelpTooltip } from '@/components/ui/help-tooltip';

const projectSchema = z.object({
    name: z.string().min(2, 'Projectnaam moet minimaal 2 karakters bevatten.'),
    program: z.string().optional(),
    isSensitive: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    teamIds: z.array(z.string()).optional(),
    budget: z.coerce.number().optional(),
    budgetType: z.enum(['amount', 'hours']).optional(),
    deadline: z.date().optional(),
});
type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectDialogProps {
  organizationId: string;
  project?: Project;
  allTeams: Team[];
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProjectDialog({ organizationId, project, allTeams, children, open: controlledOpen, onOpenChange: controlledOnOpenChange }: ProjectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = controlledOnOpenChange ?? setInternalOpen;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { currentOrganization } = useAuth();
    const canSharePublicly = currentOrganization?.settings?.features?.publicSharing !== false;

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: { name: '', program: '', isSensitive: false, isPublic: false, teamIds: [], budget: undefined, budgetType: undefined, deadline: undefined },
    });
    
    useEffect(() => {
        if (project) {
            form.reset({
              ...project,
              deadline: project.deadline ? new Date(project.deadline) : undefined
            });
        } else {
            form.reset({ name: '', program: '', isSensitive: false, isPublic: false, teamIds: [], budget: undefined, budgetType: undefined, deadline: undefined });
        }
    }, [project, open, form]);

    const onSubmit = async (data: ProjectFormValues) => {
        setIsSubmitting(true);
        try {
            if (project) {
                const projectRef = doc(db, 'projects', project.id);
                await updateDoc(projectRef, data as any);
                toast({ title: 'Gelukt!', description: `Project "${data.name}" is bijgewerkt.` });
            } else {
                await addDoc(collection(db, 'projects'), {
                    ...data,
                    organizationId,
                });
                toast({ title: 'Gelukt!', description: `Project "${data.name}" is aangemaakt.` });
            }
            setOpen(false);
            form.reset();
        } catch (error: any) {
            console.error("Error saving project:", error);
            toast({ title: 'Fout', description: error.message, variant: 'destructive' });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{project ? 'Project Bewerken' : 'Nieuw Project Aanmaken'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Projectnaam</FormLabel>
                                    <FormControl><Input placeholder="bijv. Website Redesign" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="program"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Programma (Optioneel)</FormLabel>
                                    <FormControl><Input placeholder="bijv. Marketing Q3" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="deadline"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Deadline (Optioneel)</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                    {field.value ? format(field.value, 'PPP') : <span>Kies een deadline</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="budget"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Budget</FormLabel>
                                        <FormControl><Input type="number" placeholder="bijv. 10000" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="budgetType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Budget Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Selecteer type..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="amount"><Euro className="mr-2 h-4 w-4"/> Bedrag (€)</SelectItem>
                                                <SelectItem value="hours"><Clock className="mr-2 h-4 w-4"/> Uren</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <FormField
                            control={form.control}
                            name="teamIds"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Toegewezen Teams</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant="outline" role="combobox" className={cn("w-full justify-start", !field.value?.length && "text-muted-foreground")}>
                                        <Users className="mr-2 h-4 w-4" />
                                        {field.value?.length > 0 ? `${field.value.length} team(s) geselecteerd` : 'Selecteer teams'}
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Zoek team..." />
                                        <CommandList>
                                        <CommandEmpty>Geen teams gevonden.</CommandEmpty>
                                        <CommandGroup>
                                            {allTeams.map((team) => {
                                            const isSelected = field.value?.includes(team.id);
                                            return (
                                                <CommandItem
                                                key={team.id}
                                                onSelect={() => {
                                                    if (isSelected) {
                                                    field.onChange(field.value?.filter((id) => id !== team.id));
                                                    } else {
                                                    field.onChange([...(field.value || []), team.id]);
                                                    }
                                                }}
                                                >
                                                <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}/>
                                                {team.name}
                                                </CommandItem>
                                            );
                                            })}
                                        </CommandGroup>
                                        </CommandList>
                                    </Command>
                                    </PopoverContent>
                                </Popover>
                                <div className="pt-1 h-fit min-h-[22px]">
                                    {field.value?.map((teamId: string) => {
                                        const team = allTeams.find(t => t.id === teamId);
                                        if (!team) return null;
                                        return (
                                        <Badge variant="secondary" key={teamId} className="mr-1 mb-1">
                                            {team.name}
                                            <button
                                            type="button"
                                            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => field.onChange(field.value?.filter((id: string) => id !== teamId))}
                                            >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </button>
                                        </Badge>
                                        )
                                    })}
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isSensitive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <div className="flex items-center">
                                      <FormLabel>Gevoelig Project</FormLabel>
                                      <HelpTooltip content="Taken in dit project zijn enkel zichtbaar voor leden met de 'Bekijk Gevoelige Data' permissie." />
                                    </div>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}
                        />
                        {canSharePublicly && (
                            <FormField
                                control={form.control}
                                name="isPublic"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center">
                                          <FormLabel>Publiek Zichtbaar</FormLabel>
                                          <HelpTooltip content="Maakt een read-only versie van dit project's bord deelbaar via een openbare link. Gevoelige taken worden nooit getoond." />
                                        </div>
                                    </div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )}
                            />
                        )}
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Annuleren</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {project ? 'Wijzigingen Opslaan' : 'Project Aanmaken'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
