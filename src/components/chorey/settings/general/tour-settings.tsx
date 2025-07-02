
'use client';

import { useAuth } from '@/contexts/user/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { HelpCircle } from 'lucide-react';
import { updateUserProfile } from '@/app/actions/user/user.actions';
import { useToast } from '@/hooks/use-toast';
import { useTour } from '@/contexts/feature/tour-context';
import { Button } from '@/components/ui/button';

export default function TourSettings() {
  const { user, refreshUser } = useAuth();
  const { startTour } = useTour();
  const { toast } = useToast();

  if (!user) return null;

  const showTour = user.showTour ?? true; // Default to true if not set

  const handleToggle = async (enabled: boolean) => {
    const result = await updateUserProfile(user.id, { showTour: enabled });
    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Instelling opgeslagen' });
      await refreshUser();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle /> Interactieve Gids (Tour)
        </CardTitle>
        <CardDescription>
          Beheer of de interactieve gids automatisch start voor nieuwe gebruikers of speel hem opnieuw af.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="tour-toggle" className="font-semibold">
              Onboarding Gids Automatisch Starten
            </Label>
            <p className="text-sm text-muted-foreground">
              Indien ingeschakeld, start de gids automatisch voor gebruikers die de onboarding nog niet hebben voltooid.
            </p>
          </div>
          <Switch
            id="tour-toggle"
            checked={showTour}
            onCheckedChange={handleToggle}
          />
        </div>
        <Button variant="outline" onClick={startTour}>
            Speel Gids Opnieuw Af
        </Button>
      </CardContent>
    </Card>
  );
}
