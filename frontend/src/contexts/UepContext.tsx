import React, { createContext, useContext, useState, useEffect } from 'react';
import { UepType } from '../types/uep';

export interface UepContextType {
  selectedUep: UepType | null;
  setSelectedUep: (uep: UepType) => void;
  clearSelectedUep: () => void;
}

const STORAGE_KEY = 'terrarium_selected_uep';

export const UepContext = createContext<UepContextType | undefined>(undefined);

interface UepProviderProps {
  children: React.ReactNode;
  initialUep?: UepType;
}

export const UepProvider: React.FC<UepProviderProps> = ({ children, initialUep }) => {
  const [selectedUep, setSelectedUepState] = useState<UepType | null>(() => {
    if (initialUep) return initialUep;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === 'olericultura' || stored === 'fruticultura') {
        return stored;
      }
    } catch {
      // Storage access may fail in restricted sandboxes
    }
    return null;
  });

  const setSelectedUep = (uep: UepType) => {
    setSelectedUepState(uep);
    try {
      sessionStorage.setItem(STORAGE_KEY, uep);
    } catch {
      // Ignore storage write errors
    }
  };

  const clearSelectedUep = () => {
    setSelectedUepState(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage removal errors
    }
  };

  useEffect(() => {
    if (initialUep) {
      setSelectedUep(initialUep);
    }
  }, [initialUep]);

  return (
    <UepContext.Provider value={{ selectedUep, setSelectedUep, clearSelectedUep }}>
      {children}
    </UepContext.Provider>
  );
};

export const useUep = (): UepContextType => {
  const context = useContext(UepContext);
  if (!context) {
    throw new Error('useUep deve ser utilizado dentro de um <UepProvider>');
  }
  return context;
};
