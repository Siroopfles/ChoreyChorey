'use client';

import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';

const DEBUG_STORAGE_KEY = 'chorey_debug_mode';

type DebugContextType = {
    isDebugMode: boolean;
    setIsDebugMode: (enabled: boolean) => void;
};

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: ReactNode }) {
    const [isDebugMode, setIsDebugMode] = useState(false);

    useEffect(() => {
        const storedValue = localStorage.getItem(DEBUG_STORAGE_KEY);
        setIsDebugMode(storedValue === 'true');
    }, []);

    const handleSetIsDebugMode = (enabled: boolean) => {
        localStorage.setItem(DEBUG_STORAGE_KEY, String(enabled));
        setIsDebugMode(enabled);
    };

    const value = {
        isDebugMode,
        setIsDebugMode: handleSetIsDebugMode,
    };

    return <DebugContext.Provider value={value}>{children}</DebugContext.Provider>;
}

export function useDebug() {
    const context = useContext(DebugContext);
    if (context === undefined) {
        throw new Error('useDebug must be used within a DebugProvider');
    }
    return context;
}
