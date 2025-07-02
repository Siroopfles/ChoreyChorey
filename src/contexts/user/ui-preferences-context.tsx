
'use client';

import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

const UI_PREFERENCES_KEY = 'chorey_ui_preferences';

type UIPreferences = {
    animationSpeed: number; // e.g., 1 for normal, 0.5 for faster, 2 for slower
    font: 'pt-sans' | 'source-sans-3' | 'roboto-mono';
};

type UIPreferencesContextType = {
    preferences: UIPreferences;
    setAnimationSpeed: (speed: number) => void;
    setFont: (font: UIPreferences['font']) => void;
};

const UIPreferencesContext = createContext<UIPreferencesContextType | undefined>(undefined);

const FONT_VAR_MAP: Record<UIPreferences['font'], string> = {
    'pt-sans': 'var(--font-pt-sans)',
    'source-sans-3': 'var(--font-source-sans-3)',
    'roboto-mono': 'var(--font-roboto-mono)',
};


export function UIPreferencesProvider({ children }: { children: ReactNode }) {
    const [preferences, setPreferences] = useLocalStorage<UIPreferences>(UI_PREFERENCES_KEY, {
        animationSpeed: 1, // Default speed
        font: 'pt-sans', // Default font
    });

    useEffect(() => {
        const root = document.documentElement;
        // Apply the speed as a CSS variable on the root element
        root.style.setProperty('--animation-speed-modifier', `${preferences.animationSpeed}`);
        
        // Apply font
        const fontVar = FONT_VAR_MAP[preferences.font] || FONT_VAR_MAP['pt-sans'];
        root.style.setProperty('--font-body', fontVar);
        root.style.setProperty('--font-headline', fontVar);
        
        // Specifically set the code font if roboto-mono is selected for body
        if (preferences.font === 'roboto-mono') {
             root.style.setProperty('--font-code', fontVar);
        } else {
             root.style.setProperty('--font-code', 'var(--font-roboto-mono)');
        }


    }, [preferences]);

    const setAnimationSpeed = useCallback((speed: number) => {
        setPreferences(prev => ({ ...prev, animationSpeed: speed }));
    }, [setPreferences]);

    const setFont = useCallback((font: UIPreferences['font']) => {
        setPreferences(prev => ({ ...prev, font }));
    }, [setPreferences]);
    
    const value = useMemo(() => ({
        preferences,
        setAnimationSpeed,
        setFont,
    }), [preferences, setAnimationSpeed, setFont]);

    return <UIPreferencesContext.Provider value={value}>{children}</UIPreferencesContext.Provider>;
}

export function useUIPreferences() {
    const context = useContext(UIPreferencesContext);
    if (context === undefined) {
        throw new Error('useUIPreferences must be used within a UIPreferencesProvider');
    }
    return context;
}
