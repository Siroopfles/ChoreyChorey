'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, KeyRound, Plus, Trash2, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { generateApiKey, getApiKeys, revokeApiKey } from '@/app/actions/api.actions';
import type { ApiKey } from '@/lib/types';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

type ApiKeyDisplay = Omit<ApiKey, 'hashedKey' | 'organizationId'>;

export default function ApiKeySettings() {
    const { user, currentOrganization } = useAuth();
    const { toast } = useToast();
    const [keys, setKeys] = useState<ApiKeyDisplay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [keyName, setKeyName] = useState('');
    const [newKeyDialog, setNewKeyDialog] = useState<{ open: boolean, key: string }>({ open: false, key: '' });
    const [hasCopied, setHasCopied] = useState(false);

    useEffect(() => {
        if (currentOrganization && user) {
            getApiKeys(currentOrganization.id, user.id).then(result => {
                if (result.keys) {
                    setKeys(result.keys);
                }
                setIsLoading(false);
            });
        }
    }, [currentOrganization, user]);

    const handleGenerate = async () => {
        if (!keyName.trim() || !user || !currentOrganization) return;
        setIsGenerating(true);
        const result = await generateApiKey(currentOrganization.id, user.id, keyName);
        if (result.error) {
            toast({ title: 'Fout', description: result.error, variant: 'destructive' });
        } else {
            setNewKeyDialog({ open: true, key: result.plainTextKey });
            const fetchResult = await getApiKeys(currentOrganization.id, user.id);
            if (fetchResult.keys) setKeys(fetchResult.keys);
            setKeyName('');
        }
        setIsGenerating(false);
    };

    const handleRevoke = async (keyId: string) => {
        if (!user || !currentOrganization) return;
        const result = await revokeApiKey(keyId, currentOrganization.id, user.id);
        if (result.error) {
            toast({ title: 'Fout', description: result.error, variant: 'destructive' });
        } else {
            setKeys(keys.filter(k => k.id !== keyId));
            toast({ title: 'Sleutel Ingetrokken' });
        }
    };
    
    const handleCopy = () => {
        navigator.clipboard.writeText(newKeyDialog.key);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    }

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound/> API Sleutels</CardTitle>
                <CardDescription>Beheer API-sleutels om uw Chorey-organisatie te integreren met andere applicaties.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <Input placeholder="Naam voor nieuwe sleutel..." value={keyName} onChange={(e) => setKeyName(e.target.value)} />
                    <Button onClick={handleGenerate} disabled={!keyName.trim() || isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Plus className="mr-2 h-4 w-4" />}
                        Genereer
                    </Button>
                </div>
                {isLoading ? (
                    <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin"/></div>
                ) : (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Naam</TableHead>
                                    <TableHead>Sleutel Prefix</TableHead>
                                    <TableHead>Aangemaakt</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {keys.length > 0 ? keys.map(key => (
                                    <TableRow key={key.id}>
                                        <TableCell className="font-medium">{key.name}</TableCell>
                                        <TableCell className="font-mono text-muted-foreground">{key.keyPrefix}</TableCell>
                                        <TableCell>{format(key.createdAt, 'd MMM yyyy', { locale: nl })}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                                                        <AlertDialogDescription>Deze actie kan niet ongedaan worden gemaakt. De API-sleutel '{key.name}' wordt permanent ingetrokken.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleRevoke(key.id)} className="bg-destructive hover:bg-destructive/90">Intrekken</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24">Geen API-sleutels gevonden.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
        <Dialog open={newKeyDialog.open} onOpenChange={(open) => setNewKeyDialog({open, key: ''})}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nieuwe API Sleutel Aangemaakt</DialogTitle>
                    <DialogDescription>Dit is de enige keer dat u de volledige API-sleutel zult zien. Bewaar deze op een veilige plek.</DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 pt-4">
                    <Input value={newKeyDialog.key} readOnly className="font-mono" />
                    <Button onClick={handleCopy} size="icon">
                        {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button>Ik heb de sleutel opgeslagen</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
