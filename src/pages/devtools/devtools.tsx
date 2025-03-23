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
        className="border p-2 rounded flex items-center overflow-hidden"
      >
        <span 
          className={`font-bold mr-2 flex-shrink-0 ${isReceived ? 'text-blue-600' : 'text-green-600'}`}
        >
          {isReceived ? '← Received: ' : '→ Sent: '}
        </span>
        <span className="font-mono overflow-hidden text-ellipsis whitespace-nowrap">
          {formatData(message.data)}
        </span>
      </div>
    );
  };

  return (
    <div className="p-4 h-screen flex flex-col">
      <div className="mb-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
      
      {messages.length === 0 ? (
        <div className="text-gray-500 italic">No messages yet</div>
      ) : (
        <List
          className="border rounded"
          height={windowSize.height}
          width={windowSize.width}
          itemCount={messages.length}
          itemSize={50}
        >
          {Row}
        </List>
      )}
    </div>
  );
} 