'use client';

import { useDebug } from '@/contexts/debug-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bug } from 'lucide-react';

export default function DebugSettings() {
  const { isDebugMode, setIsDebugMode } = useDebug();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug /> Developer Instellingen
        </CardTitle>
        <CardDescription>
          Schakel de debug-modus in om gedetailleerde logs in de console te zien. Dit kan helpen bij het opsporen van problemen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch
            id="debug-mode"
            checked={isDebugMode}
            onCheckedChange={setIsDebugMode}
          />
          <Label htmlFor="debug-mode">Debug-modus inschakelen</Label>
        </div>
      </CardContent>
    </Card>
  );
}
