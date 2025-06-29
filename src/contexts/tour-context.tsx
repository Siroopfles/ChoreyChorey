
'use client';

import { createContext, useState, useContext, useEffect, useCallback, type ReactNode, useMemo } from 'react';
import { useAuth } from './auth-context';
import Joyride, { type CallBackProps, type Step, STATUS } from 'react-joyride';
import { ownerSteps, memberSteps } from '@/lib/tour-steps';
import { markOnboardingComplete } from '@/app/actions/organization.actions';

type TourContextType = {
  startTour: () => void;
};

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const { user, currentOrganization, currentUserRole, refreshUser } = useAuth();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  const needsOnboarding = useMemo(() => {
    if (!user || !currentOrganization) return false;
    const memberInfo = currentOrganization.members?.[user.id];
    return memberInfo ? !memberInfo.hasCompletedOnboarding : false;
  }, [user, currentOrganization]);

  useEffect(() => {
    if (needsOnboarding && currentUserRole) {
      const tourSteps = currentUserRole === 'Owner' ? ownerSteps : memberSteps;
      setSteps(tourSteps);
      // Delay starting the tour slightly to allow the UI to render
      setTimeout(() => setRun(true), 1000);
    } else {
      setRun(false);
    }
  }, [needsOnboarding, currentUserRole]);

  const startTour = useCallback(() => {
    if (currentUserRole) {
      const tourSteps = currentUserRole === 'Owner' ? ownerSteps : memberSteps;
      setSteps(tourSteps);
      setRun(true);
    }
  }, [currentUserRole]);
  
  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      if (user && currentOrganization) {
        await markOnboardingComplete(currentOrganization.id, user.id);
        await refreshUser();
      }
    }
  };

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
      <Joyride
        steps={steps}
        run={run}
        callback={handleJoyrideCallback}
        continuous
        showProgress
        showSkipButton
        locale={{
          back: 'Terug',
          close: 'Sluiten',
          last: 'Klaar',
          next: 'Volgende',
          skip: 'Overslaan',
        }}
        styles={{
          options: {
            arrowColor: 'hsl(var(--popover))',
            backgroundColor: 'hsl(var(--popover))',
            primaryColor: 'hsl(var(--primary))',
            textColor: 'hsl(var(--popover-foreground))',
            zIndex: 10000,
          },
          buttonClose: {
            color: 'hsl(var(--popover-foreground))'
          },
          buttonBack: {
            color: 'hsl(var(--popover-foreground))'
          }
        }}
      />
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
