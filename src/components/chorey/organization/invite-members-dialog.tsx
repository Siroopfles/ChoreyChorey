
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Mail, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import type { Invite } from '@/lib/types';

export function InviteMembersDialog({ organizationId }: { organizationId: string }) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [hasCopied, setHasCopied] = useState(false);
    const { toast } = useToast();

    const handleCreateInvite = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const newInviteRef = doc(collection(db, 'invites'));
            const newInvite: Omit<Invite, 'id'> = {
                organizationId,
                inviterId: user.id,
                status: 'pending',
                createdAt: new Date(),
            };
            await setDoc(newInviteRef, newInvite);
            const link = `${window.location.origin}/invite/${newInviteRef.id}`;
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
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Nodig Leden Uit
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Leden Uitnodigen</DialogTitle>
                    <DialogDescription>
                        {inviteLink ? 'Deel deze link met de personen die je wilt uitnodigen.' : 'Genereer een unieke link om nieuwe leden uit te nodigen voor je organisatie.'}
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
                            Genereer Uitnodigingslink
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
