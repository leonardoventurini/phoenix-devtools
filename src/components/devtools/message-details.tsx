import React from 'react';
import { Message, MessageDirection, MessageType } from './types';
import CodeMirror from '@uiw/react-codemirror';
import { atomone } from '@uiw/codemirror-theme-atomone';
import { json } from '@codemirror/lang-json';

interface MessageDetailsProps {
  message: Message | null;
}

export const MessageDetails: React.FC<MessageDetailsProps> = ({ message }) => {
  // Determine message direction
  const directionText = message?.direction === MessageDirection.Inbound ? 'Received' : 'Sent';
  
  // Calculate message time
  const messageTime = message ? new Date(message.timestamp).toLocaleString() : '';

  // Try to parse and format the data
  let formattedData = message?.data || '';
  let parsedData: any = null;
  let isJson = false;

  try {
    if (!message) {
      // No message available
    }
    // First check if we have pre-parsed data
    else if (message.parsedData) {
      parsedData = JSON.parse(message.parsedData);
      isJson = true;
    } else {
      // Otherwise try to parse the raw data
      parsedData = JSON.parse(message.data);
      isJson = true;
    }
    
    // Format the JSON for display
    if (parsedData) {
      formattedData = JSON.stringify(parsedData, null, 2);
    }
  } catch (e) {
    // Not valid JSON, keep original
  }

  return (
    <div className="h-full">
      <div className="mb-4">
        {message && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-200">Direction:</span>
              <span className="text-sm text-gray-300">{directionText}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-200">Size:</span>
              <span className="text-sm text-gray-300">{message.size} bytes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-200">Time:</span>
              <span className="text-sm text-gray-300">{messageTime}</span>
            </div>
          </div>
        )}
      </div>
      <div className="h-[calc(100%-6rem)] overflow-auto">
        {(() => {
          return formattedData ? (
            <CodeMirror
              value={formattedData}
              height="100%"
              theme={atomone}
              extensions={isJson ? [json()] : []}
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