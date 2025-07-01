'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/user/auth-context';
import { useOrganization } from '@/contexts/system/organization-context';
import type { Webhook, WebhookEvent } from '@/lib/types';
import { WEBHOOK_EVENTS } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Webhook as WebhookIcon, MoreVertical, Edit, Trash2, Globe, Check, Shield, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { manageWebhook, regenerateWebhookSecret } from '@/app/actions/core/webhook.actions';
import { WebhookDialog } from './webhook-dialog';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function WebhookSettings() {
  const { user } = useAuth();
  const { webhooks, loading, currentOrganization } = useOrganization();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [secretDialog, setSecretDialog] = useState<{ open: boolean, webhook: Webhook | null, secret?: string }>({ open: false, webhook: null });
  const { toast } = useToast();

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (webhookId: string) => {
    if (!currentOrganization || !user) return;
    const result = await manageWebhook('delete', currentOrganization.id, user.id, { webhookId });
    if (result.error) {
      toast({ title: "Fout bij verwijderen", description: result.error, variant: 'destructive' });
    } else {
      toast({ title: "Webhook verwijderd" });
    }
  };

  const handleRegenerateSecret = async () => {
    if (!secretDialog.webhook || !user) return;
    const result = await regenerateWebhookSecret(secretDialog.webhook.id, user.id);
     if (result.error) {
      toast({ title: "Fout bij genereren", description: result.error, variant: 'destructive' });
    } else if (result.newSecret){
      setSecretDialog(prev => ({...prev, secret: result.newSecret}));
      toast({ title: "Nieuw geheim gegenereerd!" });
    }
  }
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Gekopieerd!"});
  };


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><WebhookIcon /> Webhooks</CardTitle>
          <CardDescription>Beheer webhooks om Chorey te verbinden met andere applicaties.</CardDescription>
        </CardHeader>
        <CardContent className="h-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2"><WebhookIcon /> Webhooks</CardTitle>
              <CardDescription>Beheer webhooks om Chorey te verbinden met andere applicaties.</CardDescription>
            </div>
            <Button onClick={() => { setEditingWebhook(null); setIsDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Nieuwe Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Gebeurtenissen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.length > 0 ? (
                  webhooks.map(webhook => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-medium">{webhook.name}</TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-xs">{webhook.url}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map(event => (
                            <Badge key={event} variant="secondary">{WEBHOOK_EVENTS[event] || event}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={webhook.enabled ? 'default' : 'outline'} className={webhook.enabled ? 'bg-green-500/20 text-green-700 border-green-500/50' : ''}>
                          {webhook.enabled ? 'Actief' : 'Inactief'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => handleEdit(webhook)}><Edit className="mr-2 h-4 w-4" /> Bewerken</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setSecretDialog({ open: true, webhook, secret: undefined })}><Shield className="mr-2 h-4 w-4" /> Geheim Inzien</DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Verwijderen</DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                                      <AlertDialogDescription>Deze actie kan niet ongedaan worden gemaakt. Dit zal de webhook permanent verwijderen.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(webhook.id)} className="bg-destructive hover:bg-destructive/90">Verwijderen</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Geen webhooks gevonden. Maak je eerste webhook aan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <WebhookDialog 
        isOpen={isDialogOpen} 
        setIsOpen={setIsDialogOpen}
        webhook={editingWebhook}
      />
      
       <Dialog open={secretDialog.open} onOpenChange={(open) => setSecretDialog({open, webhook: null, secret: undefined})}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Webhook Geheim</DialogTitle>
                    <DialogDescription>
                        Dit geheim wordt gebruikt om de payload te ondertekenen. Bewaar het veilig.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2">
                    <Input readOnly value={secretDialog.secret || secretDialog.webhook?.secret || ''} type={secretDialog.secret ? 'text' : 'password'} />
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(secretDialog.secret || secretDialog.webhook?.secret || '')}><Copy className="h-4 w-4"/></Button>
                </div>
                 <DialogFooter className="gap-2 sm:justify-between">
                    <Button variant="outline" onClick={handleRegenerateSecret}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Nieuw Geheim Genereren
                    </Button>
                    <Button onClick={() => setSecretDialog({ open: false, webhook: null, secret: undefined })}>Sluiten</Button>
                 </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
