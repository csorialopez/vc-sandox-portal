
"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextType {
  userDataVisible: boolean;
  setUserDataVisible: (visible: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [userDataVisible, setUserDataVisible] = useState(true);

  return (
    <SettingsContext.Provider value={{ userDataVisible, setUserDataVisible }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
