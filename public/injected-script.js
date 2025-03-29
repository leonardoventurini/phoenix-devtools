(function() {
  let currentTabId = null;

  // Listen for the event to start the interception
  window.addEventListener('phx-devtools:start-interception', function(event) {
    // Extract tab ID from the event if provided
    if (event.detail && event.detail.tabId) {
      currentTabId = event.detail.tabId;
    }
    checkForLiveSocket();
  });

  function checkForLiveSocket() {
    if (window.liveSocket) {
      const originalSend = window.liveSocket.socket.conn.send;
      
      const connectionInfo = {
        phxVersion: window.liveSocket.getLatencyStat ? 'LiveView 0.18+' : 'LiveView <0.18',
        channels: Object.keys(window.liveSocket.channels || {}).map(key => {
          const channel = window.liveSocket.channels[key];
          return {
            topic: channel.topic,
            joinedOnce: channel.joinedOnce,
            state: channel.state
          };
        }),
        params: window.liveSocket.socket.params || {},
        url: window.liveSocket.socket.endPointURL || ''
      };

      console.log('Phoenix connection info', connectionInfo);
      
      window.dispatchEvent(new CustomEvent('phoenix:connection:info', {
        detail: { connectionInfo, tabId: currentTabId }
      }));
      
      // Override the send method to intercept outgoing messages
      window.liveSocket.socket.conn.send = function(data) {
        // Call original method
        const result = originalSend.apply(this, arguments);
        
        // Parse the message data if possible
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = data;
        }
        
        // Dispatch a custom event with the message data
        window.dispatchEvent(new CustomEvent('phoenix:message:outbound', {
          detail: { 
            data,
            parsedData,
            tabId: currentTabId
          }
        }));
        
        return result;
      };
      
      // Add message listener for incoming messages
      window.liveSocket.socket.conn.addEventListener('message', function(event) {
        // Parse the message data if possible
        let parsedData;
        try {
          parsedData = JSON.parse(event.data);
        } catch (e) {
          parsedData = event.data;
        }
        
        window.dispatchEvent(new CustomEvent('phoenix:message:inbound', {
          detail: { 
            data: event.data,
            parsedData,
            tabId: currentTabId
          }
        }));
      });
      
      // Monitor channel creation
      const originalChannel = window.liveSocket.channel;
      window.liveSocket.channel = function(...args) {
        const channel = originalChannel.apply(this, arguments);
        
        // Notify about new channel
        setTimeout(() => {
          const updatedChannels = Object.keys(window.liveSocket.channels || {}).map(key => {
            const ch = window.liveSocket.channels[key];
            return {
              topic: ch.topic,
              joinedOnce: ch.joinedOnce,
              state: ch.state
            };
          });
          
          window.dispatchEvent(new CustomEvent('phoenix:channels:updated', {
            detail: { channels: updatedChannels, tabId: currentTabId }
          }));
        }, 100);
        
        return channel;
      };

      // Intercept HTTP requests - override fetch
      const originalFetch = window.fetch;
      window.fetch = async function(input, init) {
        const startTime = Date.now();
        const url = typeof input === 'string' ? input : input.url;
        
        // Always capture HTTP requests regardless of Phoenix detection
        // This ensures we don't miss any relevant requests
        const requestInfo = {
          url,
          method: init?.method || 'GET',
          headers: init?.headers || {},
          body: init?.body || null
        };
        
        // Always dispatch the event for all requests
        window.dispatchEvent(new CustomEvent('phoenix:http:outbound', {
          detail: { requestInfo, tabId: currentTabId }
        }));
        
        try {
          // Execute original fetch
          const response = await originalFetch.apply(this, arguments);
          
          // Clone the response to read its body (a response body can only be read once)
          const clonedResponse = response.clone();
          let responseBody;
          try {
            responseBody = await clonedResponse.text();
          } catch (e) {
            responseBody = "[unable to read response body]";
          }
          
          // Always dispatch response event for all requests
          const responseInfo = {
            url,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries([...response.headers.entries()]),
            body: responseBody,
            time: Date.now() - startTime
          };
          
          window.dispatchEvent(new CustomEvent('phoenix:http:inbound', {
            detail: { responseInfo, tabId: currentTabId }
          }));
          
          return response;
        } catch (error) {
          // Dispatch error event for all requests
          window.dispatchEvent(new CustomEvent('phoenix:http:error', {
            detail: { url, error: error.message, time: Date.now() - startTime, tabId: currentTabId }
          }));
          throw error;
        }
      };
      
      // Intercept HTTP requests - override XMLHttpRequest
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      
      XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this._phxDevToolsMethod = method;
        this._phxDevToolsUrl = url;
        this._phxDevToolsStartTime = Date.now();
        
        return originalXHROpen.apply(this, [method, url, ...args]);
      };
      
      XMLHttpRequest.prototype.send = function(body) {
        const url = this._phxDevToolsUrl;
        const method = this._phxDevToolsMethod;
        
        // Always capture HTTP requests regardless of Phoenix detection
        const requestInfo = {
          url,
          method,
          body
        };
        
        // Always dispatch outbound event
        window.dispatchEvent(new CustomEvent('phoenix:http:outbound', {
          detail: { requestInfo, tabId: currentTabId }
        }));
        
        // Add response event listeners
        this.addEventListener('load', () => {
          const responseHeaders = {};
          const headerString = this.getAllResponseHeaders();
          if (headerString) {
            const headerPairs = headerString.split('\r\n');
            for (let i = 0; i < headerPairs.length; i++) {
              const headerPair = headerPairs[i];
              const index = headerPair.indexOf(': ');
              if (index > 0) {
                const key = headerPair.substring(0, index);
                const val = headerPair.substring(index + 2);
                responseHeaders[key] = val;
              }
            }
          }
          
          const responseInfo = {
            url,
            status: this.status,
            statusText: this.statusText,
            headers: responseHeaders,
            body: this.responseText,
            time: Date.now() - this._phxDevToolsStartTime
          };
          
          window.dispatchEvent(new CustomEvent('phoenix:http:inbound', {
            detail: { responseInfo, tabId: currentTabId }
          }));
        });
        
        this.addEventListener('error', () => {
          window.dispatchEvent(new CustomEvent('phoenix:http:error', {
            detail: { 
              url, 
              error: 'Network error', 
              time: Date.now() - this._phxDevToolsStartTime,
              tabId: currentTabId 
            }
          }));
        });
        
        return originalXHRSend.apply(this, arguments);
      };
      
      // Signal that we've hooked into liveSocket
      window.dispatchEvent(new CustomEvent('phoenix:devtools:ready', {
        detail: { status: 'ready', tabId: currentTabId }
      }));
    } else {
      // Report that liveSocket wasn't found
      window.dispatchEvent(new CustomEvent('phoenix:devtools:not-found', {
        detail: { tabId: currentTabId }
      }));
    }
  }
})(); 