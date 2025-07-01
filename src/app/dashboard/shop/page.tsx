

'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/user/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Palette, Sparkles, Store, Check, Coins, Type, Droplets, Milestone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils/utils';
import { purchaseCosmeticItem } from '@/app/actions/user/user.actions';
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

const THEMES = [
  { name: 'Chorey Blauw', primary: '221.2 83.2% 53.3%', accent: '180 70% 40%', cost: 0 },
  { name: 'Zonsondergang', primary: '24.6 95% 53.1%', accent: '346.8 77.2% 49.8%', cost: 100 },
  { name: 'Robijnrood', primary: '346.8 77.2% 49.8%', accent: '47.9 95.8% 53.1%', cost: 100 },
  { name: 'Bosgroen', primary: '142.1 76.2% 36.3%', accent: '160 60% 30%', cost: 150 },
  { name: 'Koninklijk Paars', primary: '262.1 83.3% 57.8%', accent: '290 70% 55%', cost: 150 },
  { name: 'Goudkoorts', primary: '47.9 95.8% 53.1%', accent: '35 80% 50%', cost: 250 },
  { name: 'Neon Roze', primary: '322.4 96.5% 57.5%', accent: '300 100% 60%', cost: 500 },
];

const FONTS = [
  { id: 'inter', name: 'Inter (Standaard)', cost: 0, family: 'sans-serif' },
  { id: 'source-sans', name: 'Source Sans Pro', cost: 200, family: 'sans-serif' },
  { id: 'roboto-mono', name: 'Roboto Mono', cost: 200, family: 'monospace' },
];

const RADII = [
  { id: '0.25', name: 'Scherp', value: '0.25rem', cost: 50 },
  { id: '0.5', name: 'Modern', value: '0.5rem', cost: 50 },
  { id: '0.75', name: 'Afgerond (Standaard)', value: '0.75rem', cost: 0 },
  { id: '1.0', name: 'Zacht', value: '1.0rem', cost: 50 },
];

export default function ShopPage() {
  const { user, refreshUser, loading } = useAuth();
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  const handlePurchase = async (cost: number, updates: { [key: string]: string }) => {
    if (!user || !user.currentOrganizationId) return;
    setIsPurchasing(JSON.stringify(updates));

    const result = await purchaseCosmeticItem(user.currentOrganizationId, user.id, cost, updates);

    if (result.error) {
      toast({ title: 'Aankoop Mislukt', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Aankoop Geslaagd!', description: 'Je nieuwe aanpassing is toegepast.' });
      await refreshUser();
    }
    setIsPurchasing(null);
  };
  
  if (loading) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  if (!user) {
    return <p>Geen gebruiker gevonden.</p>
  }
  
  const currentCosmetic = user.cosmetic || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Store /> Puntenwinkel</h1>
          <p className="text-muted-foreground">Wissel je verdiende punten in voor coole cosmetische items!</p>
        </div>
        <div className="border rounded-lg p-2 px-4 font-semibold flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500"/>
            <span>Je hebt {(user.points || 0).toLocaleString()} punten</span>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette/> Thema's</CardTitle>
            <CardDescription>Personaliseer je kleuren. Verandert de primaire en accentkleur.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {THEMES.map((theme) => {
                const isOwned = currentCosmetic.primaryColor === theme.primary;
                const canAfford = (user.points || 0) >= theme.cost;
                const purchaseKey = JSON.stringify({ primaryColor: theme.primary });
                return (
                    <AlertDialog key={theme.name}>
                        <Card className={cn("flex flex-col", isOwned && "border-primary ring-2 ring-primary")}>
                            <CardHeader>
                                <div className="w-full h-16 rounded-md flex overflow-hidden">
                                    <div className="w-2/3 h-full" style={{ backgroundColor: `hsl(${theme.primary})` }} />
                                    <div className="w-1/3 h-full" style={{ backgroundColor: `hsl(${theme.accent})` }} />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-1">
                                <p className="font-semibold">{theme.name}</p>
                                <div className="flex items-center gap-1.5 text-amber-500 font-medium">
                                    <Coins className="h-4 w-4"/>
                                    <span>{theme.cost > 0 ? theme.cost.toLocaleString() : 'Gratis'}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                            {isOwned ? (
                                    <Button disabled className="w-full"><Check className="mr-2 h-4 w-4" /> Ingeschakeld</Button>
                            ) : (
                                <AlertDialogTrigger asChild>
                                    <Button className="w-full" disabled={!canAfford || !!isPurchasing}>
                                        {isPurchasing === purchaseKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {canAfford ? 'Koop Thema' : 'Niet genoeg punten'}
                                    </Button>
                                </AlertDialogTrigger>
                            )}
                            </CardFooter>
                        </Card>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Weet je het zeker?</AlertDialogTitle><AlertDialogDescription>Je staat op het punt om dit thema te kopen voor {theme.cost} punten.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Annuleren</AlertDialogCancel><AlertDialogAction onClick={() => handlePurchase(theme.cost, { primaryColor: theme.primary, accent: theme.accent })}>Koop</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )
            })}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Type/> Lettertypen</CardTitle>
                  <CardDescription>Verander het lettertype van de interface.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  {FONTS.map(font => {
                      const isOwned = currentCosmetic.font === font.id;
                      const canAfford = (user.points || 0) >= font.cost;
                      const purchaseKey = JSON.stringify({ font: font.id });
                      return (
                          <AlertDialog key={font.id}>
                              <div className="flex items-center justify-between rounded-lg border p-4">
                                  <p className="font-semibold" style={{ fontFamily: `var(--font-${font.id})` }}>{font.name}</p>
                                  {isOwned ? (
                                    <Button disabled size="sm"><Check className="mr-2 h-4 w-4" /> Actief</Button>
                                  ) : (
                                      <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="outline" disabled={!canAfford || !!isPurchasing}>
                                            {isPurchasing === purchaseKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Coins className="mr-2 h-4 w-4 text-amber-500"/> {font.cost}
                                        </Button>
                                      </AlertDialogTrigger>
                                  )}
                              </div>
                              <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Weet je het zeker?</AlertDialogTitle><AlertDialogDescription>Je staat op het punt om dit lettertype te kopen voor {font.cost} punten.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Annuleren</AlertDialogCancel><AlertDialogAction onClick={() => handlePurchase(font.cost, { font: font.id })}>Koop</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      )
                  })}
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Milestone/> Stijlen</CardTitle>
                  <CardDescription>Pas de afronding van hoeken aan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                   {RADII.map(radius => {
                      const isOwned = currentCosmetic.radius === radius.id;
                      const canAfford = (user.points || 0) >= radius.cost;
                      const purchaseKey = JSON.stringify({ radius: radius.id });
                      return (
                          <AlertDialog key={radius.id}>
                              <div className="flex items-center justify-between rounded-lg border p-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/20 flex items-center justify-center" style={{ borderRadius: radius.value }}><Milestone className="h-5 w-5 text-primary"/></div>
                                    <p className="font-semibold">{radius.name}</p>
                                  </div>
                                  {isOwned ? (
                                    <Button disabled size="sm"><Check className="mr-2 h-4 w-4" /> Actief</Button>
                                  ) : (
                                      <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="outline" disabled={!canAfford || !!isPurchasing}>
                                            {isPurchasing === purchaseKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Coins className="mr-2 h-4 w-4 text-amber-500"/> {radius.cost > 0 ? radius.cost : 'Gratis'}
                                        </Button>
                                      </AlertDialogTrigger>
                                  )}
                              </div>
                              <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Weet je het zeker?</AlertDialogTitle><AlertDialogDescription>Je staat op het punt om deze stijl te kopen voor {radius.cost} punten.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Annuleren</AlertDialogCancel><AlertDialogAction onClick={() => handlePurchase(radius.cost, { radius: radius.id })}>Koop</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      )
                  })}
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
