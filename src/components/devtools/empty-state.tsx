import React from 'react';

interface EmptyStateProps {
  type: 'websocket' | 'http' | 'all';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  let message = '';
  let icon = null;
  
  if (type === 'websocket') {
    message = 'No WebSocket messages captured yet';
    icon = (
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
      </svg>
    );
  } else if (type === 'http') {
    message = 'No HTTP requests captured yet';
    icon = (
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
      </svg>
    );
  } else if (type === 'all') {
    message = 'No messages captured yet';
    icon = (
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    );
  }
  
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      {icon}
      <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
        Interact with your Phoenix application to capture traffic
      </p>
    </div>
  );
}; 