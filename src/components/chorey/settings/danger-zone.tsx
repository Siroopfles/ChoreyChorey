
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { leaveOrganization, deleteOrganization } from '@/app/actions/organization.actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Organization } from '@/lib/types';

type DangerZoneProps = {
  organization: Organization;
  isOwner: boolean;
};

export default function DangerZone({ organization, isOwner }: DangerZoneProps) {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onLeaveOrg = async () => {
    if (!user) return;
    setIsLeaving(true);
    const result = await leaveOrganization(organization.id, user.id);
    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
      setIsLeaving(false);
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: `Je hebt de organisatie ${organization.name} verlaten.` });
      router.push('/dashboard');
    }
  };

  const onDeleteOrg = async () => {
    if (!user) return;
    setIsDeleting(true);
    const result = await deleteOrganization(organization.id, user.id);
    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
      setIsDeleting(false);
    } else {
      await refreshUser();
      toast({ title: 'Organisatie verwijderd!', description: `De organisatie is succesvol verwijderd.` });
      router.push('/dashboard');
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle /> Gevarenzone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border border-destructive/20 p-4">
          <div>
            <h3 className="font-semibold">Verlaat Organisatie</h3>
            <p className="text-sm text-muted-foreground">Je verliest toegang tot alle taken en teams.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="mt-2 sm:mt-0 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive" disabled={isOwner}>
                Organisatie Verlaten
              </Button>
            </AlertDialogTrigger>
            {isOwner && <p className="text-xs text-muted-foreground mt-1 sm:hidden">Eigenaar kan niet verlaten.</p>}
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                <AlertDialogDescription>
                  Deze actie kan niet ongedaan worden gemaakt. Je wordt uit de organisatie '{organization.name}' verwijderd.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                <AlertDialogAction onClick={onLeaveOrg} disabled={isLeaving} className="bg-destructive hover:bg-destructive/90">
                  {isLeaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verlaten
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {isOwner && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border border-destructive/20 p-4">
            <div>
              <h3 className="font-semibold">Verwijder Organisatie</h3>
              <p className="text-sm text-muted-foreground">Alle data, inclusief taken, teams en leden, wordt permanent verwijderd.</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="mt-2 sm:mt-0">
                  Organisatie Verwijderen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Weet je absoluut zeker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Deze actie kan niet ongedaan worden gemaakt. Dit zal de organisatie '{organization.name}' en alle bijbehorende data permanent verwijderen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteOrg} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verwijderen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
