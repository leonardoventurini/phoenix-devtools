import React, { createContext } from 'react';
import { RootStore } from '../stores/root-store';

export const StoreContext = createContext<RootStore | null>(null);

export const StoreProvider: React.FC<{
  children: React.ReactNode;
  store: RootStore;
}> = ({ children, store }) => {
  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
}; 