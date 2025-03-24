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

// Fix for React 18 TypeScript compatibility issue
const List = _FixedSizeList as ComponentType<FixedSizeListProps>;

export const DevToolsPanel = observer(() => {
  const devToolsStore = useDevToolsStore();
  const windowSize = useWindowSize({ width: 40, height: 100 });
  
  useEffect(() => {
    // Connect to background script and set up message listeners
    const cleanup = devToolsStore.connectToDevTools();
    
    // Cleanup function
    return cleanup;
  }, [devToolsStore]);
  
  const handleClear = () => {
    devToolsStore.clearMessages();
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <button 
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors flex items-center"
          onClick={handleClear}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Clear
        </button>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-1 flex-grow">
        {devToolsStore.combinedMessages.length === 0 ? (
          <EmptyState type="all" />
        ) : (
          <div className="h-full">
            <List
              className="rounded-md"
              height={windowSize.height}
              width={windowSize.width}
              itemCount={devToolsStore.combinedMessages.length}
              itemSize={70}
              itemData={{ messages: devToolsStore.combinedMessages }}
            >
              {RowCombined}
            </List>
          </div>
        )}
      </div>
    </div>
  );
}); 