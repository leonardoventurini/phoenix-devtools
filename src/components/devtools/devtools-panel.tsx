import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { EmptyState } from './empty-state';
import { useWindowSize } from './hooks';
import { useDevToolsStore } from '../../hooks/use-devtools-store';
import { IconRefresh, IconTrash, IconBug, IconBugOff } from '@tabler/icons-react';
import { NavButton } from '../ui/nav-button';
import { MessageList } from './message-list';

export const DevToolsPanel = observer(() => {
  const store = useDevToolsStore();
  const windowSize = useWindowSize({ width: 0, height: 64 });
  
  useEffect(() => {
    // Connect to background script and set up message listeners
    const cleanup = store.connectToDevTools();
    
    // Cleanup function
    return cleanup;
  }, [store]);
  
  const handleClear = () => {
    store.clearMessages();
  };

  const handleReload = () => {
    location.reload();
  };

  const handleToggleDebugger = () => {
    console.log(`Toggling debugger. Current state: ${store.isDebuggerAttached ? 'attached' : 'detached'}`);
    store.toggleDebugger();
  };

  return (
    <div className="bg-slate-700 h-screen p-0 flex flex-col overflow-hidden">
      <div className="flex w-full justify-between h-8">
        <NavButton
          variant={store.isDebuggerAttached ? 'warning' : 'primary'}
          onClick={handleToggleDebugger}
          square
        >
          {store.isDebuggerAttached ? (
            <>
              <IconBugOff className="size-4 mr-1" />
              Stop Debugger
            </>
          ) : (
            <>
              <IconBug className="size-4 mr-1" />
              Start Debugger
            </>
          )}
        </NavButton>
        
        <NavButton
          variant='info'
          onClick={handleReload}
          square
        >
          <IconRefresh className="size-4 mr-1" />
          Reload
        </NavButton>
      </div>
      
      <div className="flex-grow overflow-auto">
        <MessageList />
      </div>

      <div className="flex w-full justify-start h-8">
        <NavButton
          variant='danger'
          onClick={handleClear}
          square
        >
          <IconTrash className="size-4 mr-1" />
          Clear
        </NavButton>
      </div>
    </div>
  );
}); 