import React from 'react';
import { Message } from './types';
import { formatData } from './utils';

interface WebSocketRowProps {
  index: number;
  style: React.CSSProperties;
  data: { messages: Message[] };
}

export const RowWebSocket = ({ index, style, data }: WebSocketRowProps) => {
  const message = data.messages[index];
  const isReceived = message.method === 'Network.webSocketFrameReceived';
  
  return (
    <div 
      key={message.hash}
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