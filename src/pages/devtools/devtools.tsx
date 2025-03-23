import React, { useEffect, useState } from 'react';
import Browser from 'webextension-polyfill';

interface Message {
  method: string;
  data: string;
}

interface PortResponse {
  messages?: Message[];
}

export function DevTools() {
  const [messages, setMessages] = useState<Message[]>([]);
  
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
    
    // Cleanup function
    return () => {
      clearInterval(interval);
      port.disconnect();
    };
  }, []);
  
  const handleClear = () => {
    const port = Browser.runtime.connect({ name: 'devtools' });
    port.postMessage({ action: 'clearMessages' });
    setMessages([]);
  };

  return (
    <div className="p-4">
      <button 
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={handleClear}
      >
        Clear
      </button>
      
      <ul className="space-y-2">
        {messages.map((message, index) => (
          <li key={index} className="border p-2 rounded">
            <span 
              className={`font-bold ${message.method === 'Network.webSocketFrameReceived' ? 'text-blue-600' : 'text-green-600'}`}
            >
              {message.method === 'Network.webSocketFrameReceived' ? '← Received: ' : '→ Sent: '}
            </span>
            <span className="font-mono whitespace-pre-wrap">
              {(() => {
                try {
                  // Try to parse as JSON
                  const jsonData = JSON.parse(message.data);
                  return JSON.stringify(jsonData, null, 2);
                } catch (e) {
                  // If not JSON, display as plain text
                  return message.data;
                }
              })()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
} 