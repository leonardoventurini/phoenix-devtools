import React from 'react';
import { ActiveTab } from './types';

interface EmptyStateProps {
  type: ActiveTab;
}

export const EmptyState = ({ type }: EmptyStateProps) => {
  const messages = {
    websocket: {
      title: 'No WebSocket messages captured yet',
      subtitle: 'WebSocket messages will appear here once communication begins'
    },
    http: {
      title: 'No HTTP requests captured yet',
      subtitle: 'HTTP requests will appear here once network activity begins'
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-30" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <p className="text-center">{messages[type].title}</p>
      <p className="text-sm mt-2">{messages[type].subtitle}</p>
    </div>
  );
}; 