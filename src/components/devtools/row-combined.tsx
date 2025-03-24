import React from 'react';
import { Message } from './types';
import { formatData } from './utils';

interface CombinedRowProps {
  index: number;
  style: React.CSSProperties;
  data: { messages: Message[] };
}

export const RowCombined = ({ index, style, data }: CombinedRowProps) => {
  const message = data.messages[index];
  const isWebSocket = message.type === 'websocket';
  
  if (isWebSocket) {
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
          <div className="font-medium text-sm mb-1 text-gray-700 dark:text-gray-300 flex items-center">
            <span>{isReceived ? 'Received' : 'Sent'}</span>
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
              WebSocket
            </span>
          </div>
          <div className="font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap text-gray-600 dark:text-gray-400">
            {formatData(message.data)}
          </div>
        </div>
      </div>
    );
  } else {
    // HTTP Message
    const isRequest = message.method === 'Network.requestWillBeSent';
    
    let parsedData;
    try {
      parsedData = JSON.parse(message.data);
    } catch (e) {
      parsedData = { error: "Unable to parse data" };
    }
    
    const url = isRequest ? parsedData.request?.url : parsedData.response?.url;
    const method = isRequest ? parsedData.request?.method : 'Response';
    
    return (
      <div
        key={message.hash}
        style={style}
        className="border border-gray-200 dark:border-gray-700 p-3 rounded-md my-1 flex items-center overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex-shrink-0 mr-3">
          {isRequest ? (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600 dark:text-purple-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          ) : (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
        <div className="flex-grow">
          <div className="font-medium text-sm mb-1 text-gray-700 dark:text-gray-300 flex items-center">
            <span className="font-bold">{method}</span> {url ? url.substring(0, 50) + (url.length > 50 ? '...' : '') : 'Unknown URL'}
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
              HTTP
            </span>
          </div>
          <div className="font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap text-gray-600 dark:text-gray-400">
            {isRequest ? 
              (parsedData.request?.headers ? JSON.stringify(parsedData.request.headers) : 'No headers') : 
              (parsedData.response?.status ? `Status: ${parsedData.response.status}` : 'No status')}
          </div>
        </div>
      </div>
    );
  }
}; 