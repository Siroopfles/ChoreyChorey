
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Hand } from 'lucide-react';

export function WelcomeWidget({ name }: { name: string }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Goedemorgen';
    if (hour < 18) return 'Goedemiddag';
    return 'Goedenavond';
  };

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Hand className="text-yellow-500" />
          {getGreeting()}, {name}!
        </CardTitle>
        <CardDescription>Klaar om de dag te veroveren?</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Gebruik dit dashboard om een overzicht te krijgen van je taken en de voortgang van het team. Klik op het instellingen-icoon om je dashboard aan te passen.
        </p>
      </CardContent>
    </>
  );
}
