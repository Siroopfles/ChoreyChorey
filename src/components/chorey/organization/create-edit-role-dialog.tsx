
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/user/auth-context';
import { updateOrganization } from '@/app/actions/core/organization.actions';
import { PERMISSIONS, PERMISSIONS_DESCRIPTIONS } from '@/lib/types';
import type { Permission } from '@/lib/types';

const roleSchema = z.object({
  name: z.string().min(2, 'Rolnaam moet minimaal 2 karakters bevatten.'),
  permissions: z.array(z.string()).min(1, 'Een rol moet minimaal één permissie hebben.'),
});
type RoleFormValues = z.infer<typeof roleSchema>;

interface CreateEditRoleDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    editingRole: { id: string, name: string, permissions: Permission[] } | null;
}

export function CreateEditRoleDialog({ isOpen, setIsOpen, editingRole }: CreateEditRoleDialogProps) {
    const { user, currentOrganization, refreshUser } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<RoleFormValues>({
        resolver: zodResolver(roleSchema),
        defaultValues: { name: '', permissions: [] },
    });
    
    useEffect(() => {
        if (editingRole) {
            form.reset({ name: editingRole.name, permissions: editingRole.permissions });
        } else {
            form.reset({ name: '', permissions: [] });
        }
    }, [editingRole, isOpen, form]);

    const onSubmit = async (data: RoleFormValues) => {
        if (!user || !currentOrganization) return;
        setIsSubmitting(true);
        
        const customRoles = currentOrganization.settings?.customization?.customRoles || {};
        const roleId = editingRole ? editingRole.id : data.name.toLowerCase().replace(/\s+/g, '_');
        
        if (!editingRole && customRoles[roleId]) {
            toast({ title: 'Fout', description: 'Een rol met deze naam (of ID) bestaat al.', variant: 'destructive' });
            setIsSubmitting(false);
            return;
        }

        const updatedCustomRoles = {
            ...customRoles,
            [roleId]: { name: data.name, permissions: data.permissions as Permission[] }
        };

        const newSettings = {
            ...currentOrganization.settings,
            customization: {
                ...currentOrganization.settings?.customization,
                customRoles: updatedCustomRoles,
            }
        };

        const result = await updateOrganization(currentOrganization.id, user.id, { settings: newSettings });

        if (result.error) {
            toast({ title: 'Fout', description: result.error, variant: 'destructive' });
        } else {
            await refreshUser();
            toast({ title: 'Gelukt!', description: `Rol '${data.name}' is opgeslagen.` });
            setIsOpen(false);
        }
        setIsSubmitting(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingRole ? 'Rol Bewerken' : 'Nieuwe Rol Aanmaken'}</DialogTitle>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rolnaam</FormLabel>
                                    <FormControl>
                                        <Input placeholder="bijv. Project Manager" {...field} disabled={!!editingRole} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="permissions"
                            render={() => (
                                <FormItem>
                                     <FormLabel>Permissies</FormLabel>
                                    <ScrollArea className="h-64 rounded-md border p-4">
                                        <div className="space-y-4">
                                        {Object.values(PERMISSIONS).map((permissionId) => (
                                            <FormField
                                                key={permissionId}
                                                control={form.control}
                                                name="permissions"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={permissionId}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(permissionId)}
                                                                    onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...field.value, permissionId])
                                                                        : field.onChange(
                                                                            field.value?.filter(
                                                                            (value) => value !== permissionId
                                                                            )
                                                                        )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal w-full">
                                                                <p className="font-medium">{PERMISSIONS_DESCRIPTIONS[permissionId].name}</p>
                                                                <p className="text-xs text-muted-foreground">{PERMISSIONS_DESCRIPTIONS[permissionId].description}</p>
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                         ))}
                                        </div>
                                    </ScrollArea>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="ghost">Annuleren</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingRole ? 'Rol Opslaan' : 'Rol Aanmaken'}
                            </Button>
                        </DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    )
}
