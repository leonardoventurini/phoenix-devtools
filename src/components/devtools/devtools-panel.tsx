import React, { useEffect, ComponentType } from 'react';
import { observer } from 'mobx-react-lite';
import { FixedSizeList as _FixedSizeList, FixedSizeListProps } from 'react-window';

import { Message } from './types';
import { RowWebSocket } from './row-websocket';
import { RowHttp } from './row-http';
import { RowCombined } from './row-combined';
import { EmptyState } from './empty-state';
import { useWindowSize } from './hooks';
import { useDevToolsStore } from '../../stores/store-context';
import { IconRefresh, IconTrash } from '@tabler/icons-react';
import { NavButton } from '../ui/nav-button';

// Fix for React 18 TypeScript compatibility issue
const List = _FixedSizeList as ComponentType<FixedSizeListProps>;

export const DevToolsPanel = observer(() => {
  const devToolsStore = useDevToolsStore();
  const windowSize = useWindowSize({ width: 0, height: 64 });
  
  useEffect(() => {
    // Connect to background script and set up message listeners
    const cleanup = devToolsStore.connectToDevTools();
    
    // Cleanup function
    return cleanup;
  }, [devToolsStore]);
  
  const handleClear = () => {
    devToolsStore.clearMessages();
  };

  const handleReload = () => {
    location.reload();
  };

  return (
    <div className="bg-slate-700 h-screen p-0 flex flex-col overflow-hidden">
      <div className="flex w-full justify-end h-8">
        <NavButton
          variant='info'
          onClick={handleReload}
          square
        >
          <IconRefresh className="size-4 mr-1" />
          Reload
        </NavButton>
      </div>
      
      <div className="flex-grow">
        {devToolsStore.combinedMessages.length === 0 ? (
          <EmptyState type="all" />
        ) : (
          <div className="h-full">
            <List
              className="rounded-md"
              height={windowSize.height}
              width={windowSize.width}
              itemCount={devToolsStore.combinedMessages.length}
              itemSize={48}
              itemData={{ messages: devToolsStore.combinedMessages }}
            >
              {RowCombined}
            </List>
          </div>
        )}
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