import React, { useEffect, useState, useMemo } from 'react';
import Browser from 'webextension-polyfill';
import { FixedSizeList as List } from 'react-window';

interface Message {
  method: string;
  data: string;
}

interface PortResponse {
  messages?: Message[];
}

export function DevTools() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth - 40, height: window.innerHeight - 100 });
  
  useEffect(() => {
    const port = Browser.runtime.connect({ name: 'devtools' });
    
    port.postMessage({ action: 'attachDebugger' });
    port.postMessage({ action: 'getMessages' });
    
    port.onMessage.addListener((message) => {
      const response = message as PortResponse;
      if (response.messages) {
        setMessages(response.messages);
      }
    });
    
    // Poll for messages every second
    const interval = setInterval(() => {
      port.postMessage({ action: 'getMessages' });
    }, 1000);
    
    // Update window size on resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth - 40,
        height: window.innerHeight - 100
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      clearInterval(interval);
      port.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const handleClear = () => {
    const port = Browser.runtime.connect({ name: 'devtools' });
    port.postMessage({ action: 'clearMessages' });
    setMessages([]);
  };

  // Format message data for single line display
  const formatData = (data: string) => {
    try {
      // Try to parse as JSON and format as compact string
      const jsonData = JSON.parse(data);
      return JSON.stringify(jsonData);
    } catch (e) {
      // If not JSON, display as plain text
      return data;
    }
  };

  // Row renderer for virtualized list
  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const message = messages[index];
    const isReceived = message.method === 'Network.webSocketFrameReceived';
    
    return (
      <div 
        style={style}
        className="border border-gray-200 dark:border-gray-700 p-3 rounded-md my-1 flex items-center overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex-shrink-0 mr-3">
          {isReceived ? (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
              </svg>
            </span>
          ) : (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
        <div className="flex-grow">
          <div className="font-medium text-sm mb-1 text-gray-700 dark:text-gray-300">
            {isReceived ? 'Received' : 'Sent'}
          </div>
          <div className="font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap text-gray-600 dark:text-gray-400">
            {formatData(message.data)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">WebSocket Inspector</h1>
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
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-30" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-center">No messages captured yet</p>
            <p className="text-sm mt-2">WebSocket messages will appear here once communication begins</p>
          </div>
        ) : (
          <List
            className="rounded-md"
            height={windowSize.height}
            width={windowSize.width}
            itemCount={messages.length}
            itemSize={70}
          >
            {Row}
          </List>
        )}
      </div>
    </div>
  );
} 