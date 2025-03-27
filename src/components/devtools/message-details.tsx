import React from 'react';
import { Message, MessageDirection, MessageType } from './types';
import CodeMirror from '@uiw/react-codemirror';
import { atomone } from '@uiw/codemirror-theme-atomone';
import { json } from '@codemirror/lang-json';

interface MessageDetailsProps {
  message: Message | null;
}

export const MessageDetails: React.FC<MessageDetailsProps> = ({ message }) => {
  // Format message data for display
  const getFormattedMessageData = () => {
    if (!message) return '';
    
    try {
      // For WebSocket messages, try to parse as JSON
      if (message.type === MessageType.WebSocket) {
        const parsedData = JSON.parse(message.data);
        return JSON.stringify(parsedData, null, 2);
      } 
      
      // For HTTP messages, try to parse it first
      if (message.type === MessageType.Http) {
        try {
          const parsedData = JSON.parse(message.data);
          
          // Extract request/response based on direction
          if (message.direction === MessageDirection.Inbound && parsedData.response) {
            return JSON.stringify(parsedData.response, null, 2);
          } else if (message.direction === MessageDirection.Outbound && parsedData.request) {
            return JSON.stringify(parsedData.request, null, 2);
          }
          
          // Fallback to the full data
          return JSON.stringify(parsedData, null, 2);
        } catch (e) {
          // If not valid JSON, return as is
          return message.data;
        }
      }
      
      // Default case
      return message.data;
    } catch (e) {
      // If parsing fails, return as is
      return message.data;
    }
  };

  // Determine if content is JSON
  const isJsonContent = () => {
    if (!message) return false;
    
    try {
      JSON.parse(message.data);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="h-full">
      <div className="mb-4">
        {message && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Direction:</span>
              <span className="text-sm">{message.direction}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Size:</span>
              <span className="text-sm">{message.size} bytes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Time:</span>
              <span className="text-sm">{new Date(message.timestamp).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
      <div className="h-[calc(100%-6rem)] overflow-auto">
        {(() => {
          const formattedData = getFormattedMessageData();
          return formattedData ? (
            <CodeMirror
              value={formattedData}
              height="100%"
              theme={atomone}
              extensions={isJsonContent() ? [json()] : []}
              readOnly={true}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
                indentOnInput: true,
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">No content to display</p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}; 