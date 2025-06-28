
'use client';

import { createContext, useState, useContext, useEffect, useCallback, type ReactNode } from 'react';
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

  useEffect(() => {
    if (user && currentOrganization && currentUserRole) {
      const memberInfo = currentOrganization.members?.[user.id];
      if (memberInfo && !memberInfo.hasCompletedOnboarding) {
        const tourSteps = currentUserRole === 'Owner' ? ownerSteps : memberSteps;
        setSteps(tourSteps);
        // Delay starting the tour slightly to allow the UI to render
        setTimeout(() => setRun(true), 1000);
      }
    }
  }, [user, currentOrganization, currentUserRole]);

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
        await refreshUser(); // To update the user state and prevent the tour from re-running
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
            zIndex: 10000,
            primaryColor: 'hsl(var(--primary))',
            textColor: 'hsl(var(--foreground))',
          },
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
