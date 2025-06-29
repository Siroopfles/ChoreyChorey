'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import type { Filters, Priority } from '@/lib/types';

type FilterContextType = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTaskIds: string[];
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleTaskSelection: (taskId: string) => void;
  filters: Filters;
  setFilters: (newFilters: Partial<Filters>) => void;
  clearFilters: () => void;
  activeFilterCount: number;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [filters, setRawFilters] = useState<Filters>({ assigneeId: null, labels: [], priority: null, projectId: null, teamId: null });

  const setFilters = (newFilters: Partial<Filters>) => {
    setRawFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setRawFilters({ assigneeId: null, labels: [], priority: null, projectId: null, teamId: null });
    setSearchTerm('');
  };
  
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };
  
  const activeFilterCount =
    (filters.assigneeId ? 1 : 0) +
    filters.labels.length +
    (filters.priority ? 1 : 0) +
    (filters.projectId ? 1 : 0) +
    (filters.teamId ? 1 : 0);

  const value = {
    searchTerm,
    setSearchTerm,
    selectedTaskIds,
    setSelectedTaskIds,
    toggleTaskSelection,
    filters,
    setFilters,
    clearFilters,
    activeFilterCount
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
