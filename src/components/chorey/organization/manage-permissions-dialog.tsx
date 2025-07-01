
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save, ShieldBan, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/user/auth-context';
import { updateMemberPermissions } from '@/app/actions/user/member.actions';
import { PERMISSIONS, PERMISSIONS_DESCRIPTIONS, type Permission, type User } from '@/lib/types';
import { cn } from '@/lib/utils/utils';
import { useOrganization } from '@/contexts/system/organization-context';

// Using a custom SVG for inherit icon
const InheritIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M2 16.2A5 5 0 0 1 7 21a5 5 0 0 1 5-4.8V3"/><path d="M7 21a5 5 0 0 0 5-4.8V3"/><path d="M11 3L7 7l4 4"/>
    </svg>
);


type PermissionState = 'inherit' | 'grant' | 'revoke';
type PermissionOverridesForm = Record<Permission, PermissionState>;

interface ManagePermissionsDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  member: User;
}

export function ManagePermissionsDialog({ isOpen, setIsOpen, member }: ManagePermissionsDialogProps) {
  const { user, refreshUser } = useAuth();
  const { currentOrganization } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PermissionOverridesForm>();

  useEffect(() => {
    if (member && currentOrganization) {
      const memberData = currentOrganization.members?.[member.id];
      const overrides = memberData?.permissionOverrides;
      const initialValues: any = {};
      Object.values(PERMISSIONS).forEach(p => {
        if (overrides?.granted?.includes(p)) {
          initialValues[p] = 'grant';
        } else if (overrides?.revoked?.includes(p)) {
          initialValues[p] = 'revoke';
        } else {
          initialValues[p] = 'inherit';
        }
      });
      form.reset(initialValues);
    }
  }, [member, currentOrganization, isOpen, form]);

  const onSubmit = async (data: PermissionOverridesForm) => {
    if (!user || !currentOrganization) return;
    setIsSubmitting(true);
    
    const granted: Permission[] = [];
    const revoked: Permission[] = [];

    Object.entries(data).forEach(([permission, state]) => {
      if (state === 'grant') granted.push(permission as Permission);
      if (state === 'revoke') revoked.push(permission as Permission);
    });

    const result = await updateMemberPermissions(currentOrganization.id, member.id, { granted, revoked }, user.id);

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: `Permissies voor ${member.name} zijn opgeslagen.` });
      setIsOpen(false);
    }
    setIsSubmitting(false);
  };
  
  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permissies voor {member.name}</DialogTitle>
          <DialogDescription>
            Overschrijf de standaard rol-permissies voor deze specifieke gebruiker.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {Object.values(PERMISSIONS).map((permissionId) => (
                  <FormField
                    key={permissionId}
                    control={form.control}
                    name={permissionId}
                    render={({ field }) => (
                      <FormItem className="space-y-3 rounded-lg border p-4">
                        <FormLabel>{PERMISSIONS_DESCRIPTIONS[permissionId].name}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex items-center space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="inherit" /></FormControl>
                              <FormLabel className="font-normal flex items-center gap-1.5"><InheritIcon className="h-4 w-4"/> Overerven</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="grant" /></FormControl>
                              <FormLabel className="font-normal flex items-center gap-1.5 text-green-600"><ShieldCheck className="h-4 w-4"/> Toestaan</FormLabel>
                            </FormItem>
                             <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="revoke" /></FormControl>
                              <FormLabel className="font-normal flex items-center gap-1.5 text-destructive"><ShieldBan className="h-4 w-4"/> Intrekken</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 mt-4 border-t">
              <DialogClose asChild><Button type="button" variant="ghost">Annuleren</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Permissies Opslaan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
