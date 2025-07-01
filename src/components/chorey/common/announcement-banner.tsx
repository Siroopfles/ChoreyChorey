
'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import type { OrganizationSettings } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Megaphone, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

type AnnouncementBannerProps = {
  announcement: NonNullable<OrganizationSettings['announcement']>;
};

export default function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
  const [isDismissed, setIsDismissed] = useLocalStorage(`announcement-dismissed-${announcement.id}`, false);

  const isDismissible = announcement.level !== 'emergency';

  if (isDismissible && isDismissed) {
    return null;
  }

  const Icon = announcement.level === 'info' ? Megaphone : AlertTriangle;

  const getVariant = () => {
    if (announcement.level === 'emergency') {
      return 'destructive';
    }
    return 'default';
  }
  
  const getCustomClasses = () => {
     switch(announcement.level) {
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-300 [&>svg]:text-yellow-700 dark:[&>svg]:text-yellow-300';
      case 'info': return 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 [&>svg]:text-blue-700 dark:[&>svg]:text-blue-300';
      default: return '';
    }
  }


  return (
    <Alert 
        variant={getVariant()}
        className={cn(
            'mb-6 relative', 
            isDismissible && 'pr-10', 
            getCustomClasses()
        )}
    >
      <Icon className="h-4 w-4" />
      <AlertDescription>{announcement.message}</AlertDescription>
      {isDismissible && (
         <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7"
            onClick={() => setIsDismissed(true)}
            aria-label="Verberg aankondiging"
        >
            <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}
