
'use client';

import { useAuth } from '@/contexts/user/auth-context';
import { Loader2, ArrowLeft } from 'lucide-react';
import ProfileSettings from '@/components/chorey/settings/general/profile-settings';
import SessionManagement from '@/components/chorey/settings/security/session-management';
import TwoFactorAuthSettings from '@/components/chorey/settings/security/two-factor-auth-settings';
import GoogleCalendarSettings from '@/components/chorey/settings/integrations/google-calendar-settings';
import MicrosoftCalendarSettings from '@/components/chorey/settings/integrations/microsoft-calendar-settings';
import AnimationSettings from '@/components/chorey/settings/general/animation-settings';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TogglSettings from '@/components/chorey/settings/integrations/toggl-settings';
import ClockifySettings from '@/components/chorey/settings/integrations/clockify-settings';
import NotificationSoundSettings from '@/components/chorey/settings/notifications/notification-sound-settings';
import TourSettings from '@/components/chorey/settings/general/tour-settings';
import NotificationSettings from '@/components/chorey/settings/notifications/notification-settings';

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
      <NotificationSettings />
      <NotificationSoundSettings user={user} />
      <AnimationSettings />
      <TourSettings />
      <SessionManagement />
      <GoogleCalendarSettings />
      <MicrosoftCalendarSettings />
      <TogglSettings user={user} />
      <ClockifySettings user={user} />
    </div>
  );
}
