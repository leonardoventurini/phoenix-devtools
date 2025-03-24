import React from 'react';
import { observer } from 'mobx-react-lite';
import { Message } from './types';
import { EmptyState } from './empty-state';
import { useDevToolsStore } from '../../hooks/use-devtools-store';

interface MessageRowProps {
  message: Message & { type: string };
}

const MessageRow: React.FC<MessageRowProps> = ({ message }) => {
  const isWebSocket = message.type === 'websocket';
  
  if (isWebSocket) {
    const isReceived = message.method === 'Network.webSocketFrameReceived';
    
    return (
      <div className="border border-gray-200 dark:border-gray-700 p-3 rounded-md my-1 flex items-center overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
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
          <div className="font-medium text-sm mb-1 text-gray-700 dark:text-gray-300 flex items-center flex-wrap">
            <span>{isReceived ? 'Received' : 'Sent'}</span>
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
              WebSocket
            </span>
            {message.isPhoenix && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                Phoenix
              </span>
            )}
          </div>
          <div className="font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap text-gray-600 dark:text-gray-400">
            {message.data}
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
      <div className="border border-gray-200 dark:border-gray-700 p-3 rounded-md my-1 flex items-center overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="flex-shrink-0 mr-3">
          {isRequest ? (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-600 dark:text-orange-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          ) : (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-600 dark:text-teal-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
        <div className="flex-grow overflow-hidden">
          <div className="font-medium text-sm mb-1 text-gray-700 dark:text-gray-300 flex items-center flex-wrap">
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 mr-2">
              {method}
            </span>
            <span className="truncate">{url || 'Unknown URL'}</span>
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
              HTTP
            </span>
          </div>
          <div className="font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap text-gray-600 dark:text-gray-400">
            {isRequest ? 'Request' : 'Response'}
          </div>
        </div>
      </div>
    );
  }
};

export const MessageList: React.FC = observer(() => {
  const store = useDevToolsStore();
  const messages = store.combinedMessages;
  
  if (messages.length === 0) {
    return <EmptyState />;
  }
  
  return (
    <div className="overflow-auto h-full p-2">
      {messages.map((message) => (
        <div key={message.hash} className="mb-2">
          <MessageRow message={message} />
        </div>
      ))}
    </div>
  );
}); 