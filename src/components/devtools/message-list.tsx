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
  
  // Determine icon and color based on message type and direction
  let icon, bgColor, textColor;
  let label = '';
  let typeLabel = '';
  let details = '';
  
  if (isWebSocket) {
    const isReceived = message.method === 'Network.webSocketFrameReceived';
    
    if (isReceived) {
      icon = <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />;
      bgColor = "bg-blue-100 dark:bg-blue-900";
      textColor = "text-blue-600 dark:text-blue-300";
    } else {
      icon = <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />;
      bgColor = "bg-green-100 dark:bg-green-900";
      textColor = "text-green-600 dark:text-green-300";
    }
    
    label = isReceived ? 'Received' : 'Sent';
    typeLabel = 'WS';
    details = message.data;
  } else {
    // HTTP Message
    const isRequest = message.method === 'Network.requestWillBeSent';
    
    if (isRequest) {
      icon = <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />;
      bgColor = "bg-orange-100 dark:bg-orange-900";
      textColor = "text-orange-600 dark:text-orange-300";
    } else {
      icon = <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />;
      bgColor = "bg-teal-100 dark:bg-teal-900";
      textColor = "text-teal-600 dark:text-teal-300";
    }
    
    let parsedData;
    try {
      parsedData = JSON.parse(message.data);
    } catch (e) {
      parsedData = { error: "Unable to parse data" };
    }
    
    const url = isRequest ? parsedData.request?.url : parsedData.response?.url;
    const method = isRequest ? parsedData.request?.method : 'Response';
    
    label = method;
    typeLabel = 'HTTP';
    details = url || 'Unknown URL';
  }
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md h-7 flex items-center overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors px-1.5">
      <div className="flex-shrink-0 mr-1.5">
        <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${bgColor}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-2.5 w-2.5 ${textColor}`} viewBox="0 0 20 20" fill="currentColor">
            {icon}
          </svg>
        </span>
      </div>
      <div className="flex-grow flex items-center overflow-hidden">
        {!isWebSocket ? (
          <span className="px-1 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 mr-1">
            {label}
          </span>
        ) : (
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 mr-1">{label}</span>
        )}
        
        <span className={`px-1 py-0.5 text-[10px] rounded-full mr-1 ${
          isWebSocket 
            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300" 
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
        }`}>
          {typeLabel}
        </span>
        
        {isWebSocket && message.isPhoenix && (
          <span className="px-1 py-0.5 text-[10px] rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 mr-1">
            PHX
          </span>
        )}
        
        <span className={`text-[10px] truncate flex-grow max-w-[60%] ${isWebSocket ? "font-mono text-gray-600 dark:text-gray-400" : ""}`}>
          {details}
        </span>
      </div>
    </div>
  );
};

export const MessageList: React.FC = observer(() => {
  const store = useDevToolsStore();
  const messages = store.combinedMessages;
  
  if (messages.length === 0) {
    return <EmptyState />;
  }
  
  return (
    <div className="overflow-auto h-full">
      {messages.map((message: Message & { type: string }) => (
        <div key={message.hash} className="mb-0.5">
          <MessageRow message={message} />
        </div>
      ))}
    </div>
  );
}); 