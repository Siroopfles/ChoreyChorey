'use client';

import { useUIPreferences } from '@/contexts/ui-preferences-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Speed } from 'lucide-react';

export default function AnimationSettings() {
  const { preferences, setAnimationSpeed } = useUIPreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Speed /> Interface Snelheid
        </CardTitle>
        <CardDescription>
          Pas de snelheid van interface-animaties aan. Een lagere waarde is sneller.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <label className="text-sm font-medium" htmlFor="animation-speed">Animatiesnelheid: {preferences.animationSpeed.toFixed(1)}x</label>
          <Slider
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
