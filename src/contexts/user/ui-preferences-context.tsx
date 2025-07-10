
'use client';

import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

const UI_PREFERENCES_KEY = 'chorey_ui_preferences';

type UIPreferences = {
    animationSpeed: number; // e.g., 1 for normal, 0.5 for faster, 2 for slower
};

type UIPreferencesContextType = {
    preferences: UIPreferences;
    setAnimationSpeed: (speed: number) => void;
};

const UIPreferencesContext = createContext<UIPreferencesContextType | undefined>(undefined);


export function UIPreferencesProvider({ children }: { children: React.ReactNode }) {
    const [preferences, setPreferences] = useLocalStorage<UIPreferences>(UI_PREFERENCES_KEY, {
        animationSpeed: 1, // Default speed
    });

    useEffect(() => {
        const root = document.documentElement;
        // Apply the speed as a CSS variable on the root element
        root.style.setProperty('--animation-speed-modifier', `${preferences.animationSpeed}`);
        
    }, [preferences]);

    const setAnimationSpeed = useCallback((speed: number) => {
        setPreferences(prev => ({ ...prev, animationSpeed: speed }));
    }, [setPreferences]);

    
    const value = useMemo(() => ({
        preferences,
        setAnimationSpeed,
    }), [preferences, setAnimationSpeed]);

    return <UIPreferencesContext.Provider value={value}>{children}</UIPreferencesContext.Provider>;
}

export function useUIPreferences() {
    const context = useContext(UIPreferencesContext);
    if (context === undefined) {
        throw new Error('useUIPreferences must be used within a UIPreferencesProvider');
    }
    return context;
}
