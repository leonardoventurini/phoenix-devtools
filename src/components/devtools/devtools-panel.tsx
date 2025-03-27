import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { EmptyState } from './empty-state';
import { useWindowSize } from './hooks';
import { useDevToolsStore } from '../../hooks/use-devtools-store';
import { IconRefresh, IconTrash, IconBug, IconBugOff, IconSearch } from '@tabler/icons-react';
import { NavButton } from '../ui/nav-button';
import { MessageList } from './message-list';

export const DevToolsPanel = observer(() => {
  const store = useDevToolsStore();
  const windowSize = useWindowSize({ width: 0, height: 64 });
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    store.setSearchTerm(value);
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

      <div className="flex w-full justify-between items-center h-8">
        <div className="relative flex items-center ml-1">
          <IconSearch className="absolute left-2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-8 pr-2 py-1 bg-slate-800 text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
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