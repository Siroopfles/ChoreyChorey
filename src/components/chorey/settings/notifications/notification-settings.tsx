'use client';

import { useFCM } from '@/contexts/fcm-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BellRing } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function NotificationSettings() {
  const { requestPermission } = useFCM();
  const [permissionStatus, setPermissionStatus] = useState<string>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const isSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;

  if (!isSupported) {
    return null; // Don't show the component if notifications aren't supported
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing /> Push Notificaties
        </CardTitle>
        <CardDescription>
          Ontvang notificaties op dit apparaat, zelfs als de app niet open staat.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {permissionStatus === 'granted' ? (
          <p className="text-sm font-medium text-green-600">Push notificaties zijn ingeschakeld voor dit apparaat.</p>
        ) : (
          <Button onClick={requestPermission} disabled={permissionStatus === 'denied'}>
            {permissionStatus === 'denied' ? 'Permissies geblokkeerd in browser' : 'Schakel Notificaties In'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
