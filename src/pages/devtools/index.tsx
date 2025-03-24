import React from 'react';
import { createRoot } from 'react-dom/client';
import '@pages/devtools/index.css';
import '@assets/styles/tailwind.css';
import Browser from 'webextension-polyfill';
import { DevToolsPanel } from './devtools-panel';

Browser.devtools.panels.create('DevX', 'icon-32.png', 'src/pages/devtools/index.html').catch(console.error);

function init() {
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Can't find DevTools root element");
  const root = createRoot(rootContainer);
  root.render(<DevToolsPanel />);
}

init(); 