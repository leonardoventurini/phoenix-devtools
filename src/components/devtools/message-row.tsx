import React from 'react';
import { Message, MessageType, MessageDirection } from './types';
import { cn } from '../../utils/cn';
import { formatTimestamp, formatSize } from './utils';

interface MessageRowProps {
  message: Message;
  isNew: boolean;
  onMessageClick: (message: Message) => void;
}

export const MessageRow: React.FC<MessageRowProps> = ({ message, isNew, onMessageClick }) => {
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
      bgColor = "bg-blue-900";
      textColor = "text-blue-300";
    } else {
      icon = <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />;
      bgColor = "bg-green-900";
      textColor = "text-green-300";
    }
    
    label = isInbound ? 'Received' : 'Sent';
    typeLabel = 'WS';
    details = message.data;
  } else {
    // HTTP Message
    if (isInbound) {
      icon = <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />;
      bgColor = "bg-teal-900";
      textColor = "text-teal-300";
    } else {
      icon = <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />;
      bgColor = "bg-orange-900";
      textColor = "text-orange-300";
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
    <div 
      className={cn("border cursor-pointer border-gray-700 rounded-md h-7 flex items-center overflow-hidden hover:bg-gray-800 transition-colors px-1.5", {
        "bg-green-900/20": isNew
      })}
      onClick={() => onMessageClick(message)}
    >
      <div className="flex-shrink-0 mr-1.5">
        <span className={cn("inline-flex items-center justify-center w-4 h-4 rounded-full", bgColor)}>
          <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-2.5 w-2.5", textColor)} viewBox="0 0 20 20" fill="currentColor">
            {icon}
          </svg>
        </span>
      </div>
      <div className="flex-grow flex items-center overflow-hidden">
        <span className="text-[10px] font-mono text-gray-400 mr-1">
          {formatTimestamp(message.timestamp)}
        </span>
        
        {!isWebSocket ? (
          <span className="px-1 py-0.5 text-[10px] rounded-full bg-gray-700 text-gray-300 mr-1">
            {label}
          </span>
        ) : (
          <span className="text-[10px] font-medium text-gray-300 mr-1">{label}</span>
        )}
        
        <span className={cn("px-1 py-0.5 text-[10px] rounded-full mr-1", 
          isWebSocket 
            ? "bg-indigo-900 text-indigo-300" 
            : "bg-yellow-900 text-yellow-300"
        )}>
          {typeLabel}
        </span>
        
        {isWebSocket && message.isPhoenix && (
          <span className="px-1 py-0.5 text-[10px] rounded-full bg-purple-900 text-purple-300 mr-1">
            PHX
          </span>
        )}
        
        <span className={cn("text-[10px] truncate flex-grow max-w-[60%]", 
          isWebSocket ? "font-mono text-gray-400" : "text-gray-300"
        )}>
          {details}
        </span>

        <span className="text-[10px] font-mono text-gray-400 ml-1">
          {formatSize(message.size)}
        </span>
      </div>
    </div>
  );
}; 