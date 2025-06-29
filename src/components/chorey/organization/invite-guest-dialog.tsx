

'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { createProjectGuestInvite } from '@/app/actions/invite.actions';

export function InviteGuestDialog({ 
  projectId,
  projectName,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange 
}: { 
  projectId: string, 
  projectName: string,
  children?: ReactNode,
  open?: boolean, 
  onOpenChange?: (open: boolean) => void 
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
    
    const { user, currentOrganization } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [hasCopied, setHasCopied] = useState(false);
    const { toast } = useToast();

    const handleCreateInvite = async () => {
        if (!user || !currentOrganization) return;
        setIsLoading(true);
        try {
            const result = await createProjectGuestInvite(currentOrganization.id, projectId, user.id, currentOrganization.name);
            if(result.error || !result.data?.inviteId) throw new Error(result.error || 'Kon geen invite ID aanmaken');

            const link = `${window.location.origin}/invite/${result.data.inviteId}`;
            setInviteLink(link);
        } catch (error: any) {
            toast({ title: 'Fout', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setInviteLink('');
            setHasCopied(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gast Uitnodigen voor {projectName}</DialogTitle>
                    <DialogDescription>
                        {inviteLink ? 'Deel deze link met de gast die je wilt uitnodigen. Ze krijgen alleen toegang tot dit project.' : 'Genereer een unieke link om een gast uit te nodigen voor dit project.'}
                    </DialogDescription>
                </DialogHeader>

                {inviteLink ? (
                    <div className="flex items-center space-x-2 pt-4">
                        <Input value={inviteLink} readOnly />
                        <Button onClick={handleCopy} size="icon">
                            {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                ) : (
                    <div className="pt-4">
                        <Button onClick={handleCreateInvite} disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Genereer Gast-link
                        </Button>
                    </div>
                )}
                
                <DialogFooter className="sm:justify-start mt-4">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Sluiten
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
