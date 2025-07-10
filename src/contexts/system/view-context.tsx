

'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import type { Task } from '@/lib/types';
import Confetti from 'react-dom-confetti';

type ViewContextType = {
  isAddTaskDialogOpen: boolean;
  setIsAddTaskDialogOpen: (open: boolean) => void;
  viewedTask: Task | null;
  setViewedTask: (task: Task | null) => void;
  triggerConfetti: () => void;
};

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [viewedTask, setViewedTask] = useState<Task | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };
  
  const value = {
    isAddTaskDialogOpen,
    setIsAddTaskDialogOpen,
    viewedTask,
    setViewedTask,
    triggerConfetti,
  };

  return (
    <ViewContext.Provider value={value}>
        {children}
        <div style={{ position: 'fixed', top: '50%', left: '50%', zIndex: 9999 }}>
            <Confetti active={showConfetti} />
        </div>
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
}
