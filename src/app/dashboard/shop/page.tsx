
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Palette, Sparkles, Store, Check, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { purchaseTheme } from '@/app/actions/user.actions';
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
  { name: 'Chorey Blauw', color: '221.2 83.2% 53.3%', cost: 0 },
  { name: 'Zonsondergang Oranje', color: '24.6 95% 53.1%', cost: 100 },
  { name: 'Robijnrood', color: '346.8 77.2% 49.8%', cost: 100 },
  { name: 'Bosgroen', color: '142.1 76.2% 36.3%', cost: 150 },
  { name: 'Koninklijk Paars', color: '262.1 83.3% 57.8%', cost: 150 },
  { name: 'Goudkoorts', color: '47.9 95.8% 53.1%', cost: 250 },
  { name: 'Neon Roze', color: '322.4 96.5% 57.5%', cost: 500 },
];

export default function ShopPage() {
  const { user, refreshUser, loading } = useAuth();
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  const handlePurchase = async (color: string, cost: number) => {
    if (!user) return;
    setIsPurchasing(color);

    const result = await purchaseTheme(user.id, color, cost);

    if (result.error) {
      toast({ title: 'Aankoop Mislukt', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Aankoop Geslaagd!', description: 'Je nieuwe thema is toegepast.' });
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
  
  const currentThemeColor = user.cosmetic?.primaryColor;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Store /> Puntenwinkel</h1>
          <p className="text-muted-foreground">Wissel je verdiende punten in voor coole cosmetische items!</p>
        </div>
        <div className="border rounded-lg p-2 px-4 bg-card font-semibold flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500"/>
            <span>Je hebt {user.points.toLocaleString()} punten</span>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette/> Profiel Thema's</CardTitle>
            <CardDescription>Personaliseer de look van je interface. De primaire kleur wordt aangepast.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {THEMES.map((theme) => {
                const isOwned = currentThemeColor === theme.color;
                const canAfford = user.points >= theme.cost;

                return (
                    <Card key={theme.name} className={cn("flex flex-col", isOwned && "border-primary ring-2 ring-primary")}>
                        <CardHeader>
                            <div className="w-full h-16 rounded-md" style={{ backgroundColor: `hsl(${theme.color})` }}/>
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
                                <Button disabled className="w-full">
                                    <Check className="mr-2 h-4 w-4" />
                                    Ingeschakeld
                                </Button>
                           ) : (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button className="w-full" disabled={!canAfford || !!isPurchasing}>
                                            {isPurchasing === theme.color && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {canAfford ? 'Koop Thema' : 'Niet genoeg punten'}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Je staat op het punt om dit thema te kopen voor {theme.cost} punten. De punten worden van je saldo afgeschreven.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handlePurchase(theme.color, theme.cost)}>
                                            Koop
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                           )}
                        </CardFooter>
                    </Card>
                )
            })}
        </CardContent>
      </Card>
    </div>
  );
}
