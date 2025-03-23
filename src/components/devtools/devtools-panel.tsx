import React, { useEffect, useState, useMemo, ComponentType } from 'react';
import Browser from 'webextension-polyfill';
import { FixedSizeList as _FixedSizeList, FixedSizeListProps } from 'react-window';

import { Message, PortResponse, ActiveTab } from './types';
import { RowWebSocket } from './row-websocket';
import { RowHttp } from './row-http';
import { EmptyState } from './empty-state';
import { useWindowSize } from './hooks';

// Fix for React 18 TypeScript compatibility issue
const List = _FixedSizeList as ComponentType<FixedSizeListProps>;

export function DevToolsPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [httpMessages, setHttpMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('websocket');
  const windowSize = useWindowSize({ width: 40, height: 100 });
  
  // Create reversed message arrays for display (newest first)
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);
  const reversedHttpMessages = useMemo(() => [...httpMessages].reverse(), [httpMessages]);
  
  useEffect(() => {
    const port = Browser.runtime.connect({ name: 'devtools' });
    
    port.postMessage({ action: 'attachDebugger' });
    port.postMessage({ action: 'getMessages' });
    
    port.onMessage.addListener((message) => {
      const response = message as PortResponse;
      
      if (response.messages) {
        setMessages(response.messages);
      }
      
      if (response.httpMessages) {
        setHttpMessages(response.httpMessages);
      }
    });
    
    // Cleanup function
    return () => {
      port.disconnect();
    };
  }, []);
  
  const handleClear = () => {
    const port = Browser.runtime.connect({ name: 'devtools' });
    port.postMessage({ action: 'clearMessages' });
    // No need to manually set empty messages here
    // as the background script will broadcast the clear
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Phoenix DevTools</h1>
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
      
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'websocket'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('websocket')}
            >
              WebSocket
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'http'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('http')}
            >
              HTTP
            </button>
          </li>
        </ul>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-1 flex-grow">
        {activeTab === 'websocket' && (
          messages.length === 0 ? (
            <EmptyState type="websocket" />
          ) : (
            <div className="h-full">
              <List
                className="rounded-md"
                height={windowSize.height}
                width={windowSize.width}
                itemCount={reversedMessages.length}
                itemSize={70}
                itemData={{ messages: reversedMessages }}
              >
                {RowWebSocket}
              </List>
            </div>
          )
        )}
        
        {activeTab === 'http' && (
          httpMessages.length === 0 ? (
            <EmptyState type="http" />
          ) : (
            <div className="h-full">
              <List
                className="rounded-md"
                height={windowSize.height}
                width={windowSize.width}
                itemCount={reversedHttpMessages.length}
                itemSize={70}
                itemData={{ messages: reversedHttpMessages }}
              >
                {RowHttp}
              </List>
            </div>
          )
        )}
      </div>
    </div>
  );
} 