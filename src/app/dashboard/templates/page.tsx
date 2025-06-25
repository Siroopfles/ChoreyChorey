'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Plus, MoreVertical, Edit, Trash2, LayoutTemplate, FilePlus, Bot, Loader, Tags, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/contexts/task-context';
import { Separator } from '@/components/ui/separator';
import type { TaskTemplate, TaskTemplateFormValues, Label } from '@/lib/types';
import { taskTemplateSchema, ALL_LABELS, ALL_PRIORITIES } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';


function TemplateDialog({
  template,
  children,
}: {
  template?: TaskTemplate;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addTemplate, updateTemplate } = useTasks();

  const form = useForm<TaskTemplateFormValues>({
    resolver: zodResolver(taskTemplateSchema),
    defaultValues: template || {
      name: '',
      title: '',
      description: '',
      priority: 'Midden',
      labels: [],
      subtasks: [],
      storyPoints: undefined,
    },
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
                        {ALL_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
                      <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} />
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
                            {ALL_LABELS.map(label => (
                              <CommandItem
                                key={label}
                                onSelect={() => {
                                  const current = field.value || [];
                                  const next = current.includes(label)
                                    ? current.filter(l => l !== label)
                                    : [...current, label];
                                  field.onChange(next);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", field.value?.includes(label) ? "opacity-100" : "opacity-0")} />
                                {label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="pt-2">
                    {field.value?.map(label => <Badge key={label} variant="secondary" className="mr-1">{label}</Badge>)}
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Annuleren</Button></DialogClose>
              <Button type="submit">Opslaan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({ template }: { template: TaskTemplate }) {
  const { deleteTemplate } = useTasks();
  const { toast } = useToast();

  const onDelete = () => {
    deleteTemplate(template.id);
    toast({
        title: 'Template verwijderd',
        description: `Template "${template.name}" is verwijderd.`
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-primary" />
                {template.name}
            </CardTitle>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                     <TemplateDialog template={template}>
                        <DropdownMenuItem onSelect={e => e.preventDefault()}>
                            <Edit className="mr-2 h-4 w-4" /> Bewerken
                        </DropdownMenuItem>
                    </TemplateDialog>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" /> Verwijderen
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Deze actie kan niet ongedaan worden gemaakt. Dit zal de template permanent verwijderen.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Verwijderen</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <CardDescription>"{template.title}"</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">Prioriteit: {template.priority}</p>
        {template.labels && template.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
                {template.labels.map(label => <Badge key={label} variant="outline">{label}</Badge>)}
            </div>
        )}
      </CardContent>
      <CardFooter>
          <Button variant="outline" size="sm" className="w-full">
            <FilePlus className="mr-2 h-4 w-4" /> Taak aanmaken met template
          </Button>
      </CardFooter>
    </Card>
  );
}

export default function TemplatesPage() {
  const { templates, loading } = useTasks();

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Taaktemplates</h1>
        <TemplateDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nieuw Template
          </Button>
        </TemplateDialog>
      </div>

      <Separator />

      {templates.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardHeader className="text-center">
            <CardTitle>Nog geen templates</CardTitle>
            <CardDescription>
              Maak je eerste template aan om taken sneller aan te maken.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TemplateDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nieuw Template
              </Button>
            </TemplateDialog>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
