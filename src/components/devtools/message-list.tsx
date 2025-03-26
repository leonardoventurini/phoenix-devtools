import React, { useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { FixedSizeList } from 'react-window';
import { Message, MessageType, MessageDirection } from './types';
import { EmptyState } from './empty-state';
import { useDevToolsStore } from '../../hooks/use-devtools-store';
import { cn } from '../../utils/cn';
import { useWindowSize } from './hooks';

const _FixedSizeList = FixedSizeList as any;

interface MessageRowProps {
  message: Message;
  isNew: boolean;
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

const formatSize = (bytes: number) => {
  if (!bytes && bytes !== 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MessageRow: React.FC<MessageRowProps> = ({ message, isNew }) => {
  const isWebSocket = message.type === MessageType.WebSocket;
  const isInbound = message.direction === MessageDirection.Inbound;
  
  // Determine icon and color based on message type and direction
  let icon, bgColor, textColor;
  let label = '';
  let typeLabel = '';
  let details = '';
  
  if (isWebSocket) {
    if (isInbound) {
      icon = <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />;
      bgColor = "bg-blue-100 dark:bg-blue-900";
      textColor = "text-blue-600 dark:text-blue-300";
    } else {
      icon = <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />;
      bgColor = "bg-green-100 dark:bg-green-900";
      textColor = "text-green-600 dark:text-green-300";
    }
    
    label = isInbound ? 'Received' : 'Sent';
    typeLabel = 'WS';
    details = message.data;
  } else {
    // HTTP Message
    if (isInbound) {
      icon = <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />;
      bgColor = "bg-teal-100 dark:bg-teal-900";
      textColor = "text-teal-600 dark:text-teal-300";
    } else {
      icon = <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />;
      bgColor = "bg-orange-100 dark:bg-orange-900";
      textColor = "text-orange-600 dark:text-orange-300";
    }
    
    let parsedData;
    try {
      parsedData = JSON.parse(message.data);
    } catch (e) {
      parsedData = { error: "Unable to parse data" };
    }

    if (isInbound && parsedData.response) {
      const { url, status, statusText } = parsedData.response;
      label = `${status} ${statusText}`;
      details = url || 'Unknown URL';
    } else if (!isInbound && parsedData.request) {
      const { url, method } = parsedData.request;
      label = method || 'Unknown';
      details = url || 'Unknown URL';
    } else {
      label = isInbound ? 'Response' : 'Request';
      details = 'Unknown URL';
    }
    
    typeLabel = 'HTTP';
  }
  
  return (
    <div className={cn("border cursor-pointer border-gray-200 dark:border-gray-700 rounded-md h-7 flex items-center overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors px-1.5", {
      "bg-green-300/50 dark:bg-green-900/20": isNew
    })}>
      <div className="flex-shrink-0 mr-1.5">
        <span className={cn("inline-flex items-center justify-center w-4 h-4 rounded-full", bgColor)}>
          <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-2.5 w-2.5", textColor)} viewBox="0 0 20 20" fill="currentColor">
            {icon}
          </svg>
        </span>
      </div>
      <div className="flex-grow flex items-center overflow-hidden">
        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 mr-1">
          {formatTimestamp(message.timestamp)}
        </span>
        
        {!isWebSocket ? (
          <span className="px-1 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 mr-1">
            {label}
          </span>
        ) : (
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 mr-1">{label}</span>
        )}
        
        <span className={cn("px-1 py-0.5 text-[10px] rounded-full mr-1", 
          isWebSocket 
            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300" 
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
        )}>
          {typeLabel}
        </span>
        
        {isWebSocket && message.isPhoenix && (
          <span className="px-1 py-0.5 text-[10px] rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 mr-1">
            PHX
          </span>
        )}
        
        <span className={cn("text-[10px] truncate flex-grow max-w-[60%]", 
          isWebSocket ? "font-mono text-gray-600 dark:text-gray-400" : ""
        )}>
          {details}
        </span>

        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 ml-1">
          {formatSize(message.size)}
        </span>
      </div>
    </div>
  );
};

export const MessageList: React.FC = observer(() => {
  const store = useDevToolsStore();
  const messages = store.reversedMessages;
  const containerRef = useRef<HTMLDivElement>(null);

  const { height } = useWindowSize({ width: 0, height: 64 });

  if (messages.length === 0) {
    return <EmptyState />;
  }

  const Row = observer(({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <MessageRow message={messages[index]} isNew={store.newMessages.includes(messages[index].hash)} />
    </div>
  ));
  
  return (
    <div ref={containerRef} className="overflow-auto h-full">
      <_FixedSizeList
        height={height}
        width="100%"
        itemCount={messages.length}
        itemSize={28}
        overscanCount={5}
      >
        {Row}
      </_FixedSizeList>
    </div>
  );
}); 