
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { disableTwoFactor } from '@/app/actions/user.actions';
import { useAuth } from '@/contexts/auth-context';
import type { User } from '@/lib/types';
import { TwoFactorSetupDialog } from './two-factor-setup-dialog';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


export default function TwoFactorAuthSettings({ user }: { user: User }) {
    const { refreshUser } = useAuth();
    const { toast } = useToast();
    const [isDisabling, setIsDisabling] = useState(false);
    const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
    const [disableToken, setDisableToken] = useState('');

    const handleDisable = async () => {
        if (!disableToken) {
            toast({ title: 'Code vereist', description: 'Voer een verificatiecode in om 2FA uit te schakelen.', variant: 'destructive' });
            return;
        }
        setIsDisabling(true);
        const result = await disableTwoFactor(user.id, disableToken);
        if (result.error) {
            toast({ title: 'Fout', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: '2FA uitgeschakeld' });
            await refreshUser();
        }
        setIsDisabling(false);
        setDisableToken('');
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck /> Twee-Factor Authenticatie (2FA)</CardTitle>
                    <CardDescription>Voeg een extra beveiligingslaag toe aan je account door 2FA in te schakelen.</CardDescription>
                </CardHeader>
                <CardContent>
                    {user.twoFactorEnabled ? (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="destructive">2FA Uitschakelen</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Om 2FA uit te schakelen, voer een geldige verificatie- of herstelcode in. Dit verlaagt de beveiliging van je account.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-2">
                                     <Input 
                                        value={disableToken}
                                        onChange={(e) => setDisableToken(e.target.value)}
                                        placeholder="Voer code in..."
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDisable} disabled={isDisabling}>
                                        {isDisabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Uitschakelen
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <Button onClick={() => setIsSetupDialogOpen(true)}>
                            2FA Inschakelen
                        </Button>
                    )}
                </CardContent>
            </Card>
            <TwoFactorSetupDialog
                isOpen={isSetupDialogOpen}
                setIsOpen={setIsSetupDialogOpen}
                user={user}
            />
        </>
    );
}
