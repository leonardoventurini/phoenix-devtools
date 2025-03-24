import React, { createContext, useContext, useMemo } from 'react';
import { DevToolsStore } from './devtools-store';

interface StoreContextValue {
  devToolsStore: DevToolsStore;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const useStores = (): StoreContextValue => {
  const context = useContext(StoreContext);
  
  if (!context) {
    throw new Error('useStores must be used within a StoreProvider');
  }
  
  return context;
};

export const useDevToolsStore = (): DevToolsStore => {
  const { devToolsStore } = useStores();
  return devToolsStore;
};

interface StoreProviderProps {
  children: React.ReactNode;
}

// Create stores outside of the component to avoid recreation
const createStores = (): StoreContextValue => ({
  devToolsStore: new DevToolsStore(),
});

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  // Use useMemo to ensure stores are only created once
  const stores = useMemo(() => createStores(), []);
  
  return (
    <StoreContext.Provider value={stores}>
      {children}
    </StoreContext.Provider>
  );
}; 