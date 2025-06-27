
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Loader2, ArrowLeft } from 'lucide-react';
import ProfileSettings from '@/components/chorey/settings/profile-settings';
import SessionManagement from '@/components/chorey/settings/session-management';
import TwoFactorAuthSettings from '@/components/chorey/settings/two-factor-auth-settings';
import GoogleCalendarSettings from '@/components/chorey/settings/google-calendar-settings';
import AnimationSettings from '@/components/chorey/settings/animation-settings';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProfileSettingsPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
                <Link href="/dashboard/settings">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Terug naar Instellingen</span>
                </Link>
            </Button>
            <h1 className="font-semibold text-lg md:text-2xl">Profiel & Account Instellingen</h1>
        </div>
      
      <ProfileSettings user={user} />
      <TwoFactorAuthSettings user={user} />
      <AnimationSettings />
      <SessionManagement />
      <GoogleCalendarSettings />
    </div>
  );
}
