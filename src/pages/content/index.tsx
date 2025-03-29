import { createRoot } from 'react-dom/client';
import './style.css' 
import { Message, MessageType, MessageDirection } from '../../components/devtools/types';

const div = document.createElement('div');
div.id = '__root';
document.body.appendChild(div);

const rootContainer = document.querySelector('#__root');
if (!rootContainer) throw new Error("Can't find Content root element");
const root = createRoot(rootContainer);
root.render(
  <div className='fixed bottom-0 left-0 text-lg text-black bg-amber-400 z-50'  >
    Phoenix DevTools
  </div>
);

// Function to safely stringify data
function safeStringify(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (e) {
    return String(data);
  }
}

// Function to intercept Phoenix LiveView messages
function interceptPhoenixMessages() {
  // Instead of injecting an inline script, we'll use a more CSP-friendly approach
  // by communicating with the page through a custom event system

  // Set up listeners for our custom events from the page
  setupPageToContentScriptEvents();

  // Create a script element that points to our injected script
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected-script.js');
  script.onload = function() {
    // Clean up once loaded
    script.remove();
    // Signal to start the interception
    window.dispatchEvent(new CustomEvent('phx-devtools:start-interception'));
  };
  
  // Add the script to the page
  (document.head || document.documentElement).appendChild(script);
  
  // Try to find liveSocket repeatedly until found
  window.addEventListener('phoenix:devtools:ready', () => {
    console.log('Phoenix LiveSocket intercepted successfully');
  });
  
  // Listen for not found event
  window.addEventListener('phoenix:devtools:not-found', () => {
    // Try again after a delay
    console.log('Phoenix LiveSocket not found, will continue checking');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('phx-devtools:start-interception'));
    }, 1000);
  });
}

// Set up event listeners for custom events from the page
function setupPageToContentScriptEvents() {
  // Listen for Phoenix connection info
  window.addEventListener('phoenix:connection:info', ((event: Event) => {
    const customEvent = event as CustomEvent;
    console.log('Phoenix connection info', customEvent);
    const connectionInfo = customEvent.detail?.connectionInfo;
    
    // Send to background script
    chrome.runtime.sendMessage({ 
      action: 'phoenix-connection-info', 
      connectionInfo 
    });
  }) as EventListener);
  
  // Listen for channel updates
  window.addEventListener('phoenix:channels:updated', ((event: Event) => {
    const customEvent = event as CustomEvent;
    const channels = customEvent.detail.channels;
    
    // Send to background script
    chrome.runtime.sendMessage({ 
      action: 'phoenix-channels-updated', 
      channels 
    });
  }) as EventListener);
  
  // Listen for outbound messages
  window.addEventListener('phoenix:message:outbound', ((event: Event) => {
    const customEvent = event as CustomEvent;
    const { data, parsedData } = customEvent.detail;
    
    const message: Partial<Message> = {
      method: 'Phoenix.send',
      data: safeStringify(data),
      parsedData: safeStringify(parsedData),
      type: MessageType.WebSocket,
      direction: MessageDirection.Outbound,
      size: new TextEncoder().encode(data).length,
      isPhoenix: true,
      timestamp: Date.now()
    };
    
    // Send to background script
    chrome.runtime.sendMessage({ action: 'phoenix-message', message });
  }) as EventListener);
  
  // Listen for inbound messages
  window.addEventListener('phoenix:message:inbound', ((event: Event) => {
    const customEvent = event as CustomEvent;
    const { data, parsedData } = customEvent.detail;
    
    const message: Partial<Message> = {
      method: 'Phoenix.receive',
      data: safeStringify(data),
      parsedData: safeStringify(parsedData),
      type: MessageType.WebSocket,
      direction: MessageDirection.Inbound,
      size: new TextEncoder().encode(data).length,
      isPhoenix: true,
      timestamp: Date.now()
    };
    
    // Send to background script
    chrome.runtime.sendMessage({ action: 'phoenix-message', message });
  }) as EventListener);

  // Listen for HTTP outbound requests
  window.addEventListener('phoenix:http:outbound', ((event: Event) => {
    const customEvent = event as CustomEvent;
    const { requestInfo } = customEvent.detail;
    
    const message: Partial<Message> = {
      method: `HTTP.${requestInfo.method}`,
      data: safeStringify(requestInfo),
      parsedData: safeStringify(requestInfo),
      type: MessageType.Http,
      direction: MessageDirection.Outbound,
      size: new TextEncoder().encode(JSON.stringify(requestInfo)).length,
      isPhoenix: true,
      timestamp: Date.now()
    };
    
    // Send to background script
    chrome.runtime.sendMessage({ action: 'phoenix-message', message });
  }) as EventListener);
  
  // Listen for HTTP inbound responses
  window.addEventListener('phoenix:http:inbound', ((event: Event) => {
    const customEvent = event as CustomEvent;
    const { responseInfo } = customEvent.detail;
    
    const message: Partial<Message> = {
      method: `HTTP.Response.${responseInfo.status}`,
      data: safeStringify(responseInfo),
      parsedData: safeStringify(responseInfo),
      type: MessageType.Http,
      direction: MessageDirection.Inbound,
      size: new TextEncoder().encode(JSON.stringify(responseInfo)).length,
      isPhoenix: true,
      timestamp: Date.now()
    };
    
    // Send to background script
    chrome.runtime.sendMessage({ action: 'phoenix-message', message });
  }) as EventListener);
  
  // Listen for HTTP errors
  window.addEventListener('phoenix:http:error', ((event: Event) => {
    const customEvent = event as CustomEvent;
    const errorInfo = customEvent.detail;
    
    const message: Partial<Message> = {
      method: 'HTTP.Error',
      data: safeStringify(errorInfo),
      parsedData: safeStringify(errorInfo),
      type: MessageType.Http,
      direction: MessageDirection.Inbound,
      size: new TextEncoder().encode(JSON.stringify(errorInfo)).length,
      isPhoenix: true,
      timestamp: Date.now()
    };
    
    // Send to background script
    chrome.runtime.sendMessage({ action: 'phoenix-message', message });
  }) as EventListener);
}

try {
  console.log('Phoenix DevTools content script loaded');
  interceptPhoenixMessages();
} catch (e) {
  console.error('Error initializing Phoenix DevTools:', e);
}
