import React from 'react';

export const EmptyState: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <p className="mt-4 text-gray-600 dark:text-gray-400">No messages captured yet</p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
        Interact with your Phoenix application to capture traffic
      </p>
    </div>
  );
}; 