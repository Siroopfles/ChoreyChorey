
'use client';

import { useUIPreferences } from '@/contexts/user/ui-preferences-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Gauge } from 'lucide-react';

export default function AnimationSettings() {
  const { preferences, setAnimationSpeed } = useUIPreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge /> Interface Snelheid
        </CardTitle>
        <CardDescription>
          Pas de snelheid van interface-animaties aan. Een lagere waarde is sneller.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm font-medium">Animatiesnelheid: {preferences.animationSpeed.toFixed(1)}x</div>
          <Slider
            aria-label="Animatiesnelheid"
            id="animation-speed"
            min={0}
            max={2}
            step={0.1}
            value={[preferences.animationSpeed]}
            onValueChange={(value) => setAnimationSpeed(value[0])}
          />
           <div className="flex justify-between text-xs text-muted-foreground">
            <span>Sneller</span>
            <span>Normaal</span>
            <span>Langzamer</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
