chrome.debugger.onEvent.addListener(function(debuggeeId, method, params) {
  if (method === "Network.webSocketFrameReceived" || method === "Network.webSocketFrameSent") {
    let data = params.response ? params.response.payloadData : params.request.data;
    chrome.storage.local.get(['websocketMessages'], function(result) {
      let messages = result.websocketMessages || [];
      messages.push({method, data});
      chrome.storage.local.set({websocketMessages: messages});
    });
  }
});

chrome.debugger.onDetach.addListener(function(debuggeeId, reason) {
  chrome.storage.local.set({websocketMessages: []});
});

chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "devtools") {
    port.onDisconnect.addListener(function() {
      // Handle disconnect if needed
    });

    port.onMessage.addListener(function(request) {
      if (request.action === "attachDebugger") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            chrome.debugger.attach({tabId: tabs[0].id}, "1.3", function() {
              chrome.debugger.sendCommand({tabId: tabs[0].id}, "Network.enable");
              chrome.debugger.sendCommand({tabId: tabs[0].id}, "Network.setExtraHTTPHeaders", {
                headers: {"X-DevTools-Emulate-Network-Conditions": "true"}
              });
            });
          }
        });
      } else if (request.action === "getMessages"){
        chrome.storage.local.get(['websocketMessages'], function(result) {
          port.postMessage({messages: result.websocketMessages || []});
        });
      } else if(request.action === "clearMessages"){
        chrome.storage.local.set({websocketMessages: []});
      }
    });
  }
});