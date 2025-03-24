import '@assets/styles/tailwind.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Browser from 'webextension-polyfill';
import { RootStore } from '../../stores/root-store';
import { StoreProvider } from '../../contexts/store-context';
import { DevToolsPanel } from '@src/components/devtools/devtools-panel';

Browser.devtools.panels.create('DevX', 'icon-32.png', 'src/pages/devtools/index.html').catch(console.error);

// Create root store
const rootStore = new RootStore();

function init() {
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Can't find DevTools root element");
  const root = createRoot(rootContainer);
  root.render(
    <React.StrictMode>
      <StoreProvider store={rootStore}>
        <DevToolsPanel />
      </StoreProvider>
    </React.StrictMode>
  );
}

init(); 