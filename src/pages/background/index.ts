chrome.debugger.onEvent.addListener(function(debuggeeId, method, params: any) {
	if (method === 'Network.webSocketFrameReceived' || method === 'Network.webSocketFrameSent') {
		let data = params.response ? params.response.payloadData : params.request.data;
		hashMessage(method + data).then(messageHash => {
			chrome.storage.local.get([ 'websocketMessages' ], function(result) {
				let messages = result.websocketMessages || [];
				messages.push({ method, data, hash: messageHash });
				chrome.storage.local.set({ websocketMessages: messages });
				
				// Broadcast to all connected devtools panels
				broadcastToDevTools({
					messages: messages,
					httpMessages: null
				});
			});
		});
	} else if (method === 'Network.requestWillBeSent' || method === 'Network.responseReceived') {
		const stringifiedData = JSON.stringify(params);
		hashMessage(method + stringifiedData).then(messageHash => {
			chrome.storage.local.get([ 'httpMessages' ], function(result) {
				let messages = result.httpMessages || [];
				messages.push({ method, data: stringifiedData, hash: messageHash });
				chrome.storage.local.set({ httpMessages: messages });
				
				// Broadcast to all connected devtools panels
				broadcastToDevTools({
					messages: null,
					httpMessages: messages
				});
			});
		});
	}
});

// SHA-1 hash function for messages
async function hashMessage(content: string): Promise<string> {
	try {
		const encoder = new TextEncoder();
		const data = encoder.encode(content);
		const hashBuffer = await crypto.subtle.digest('SHA-1', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	} catch (error) {
		console.error('Hash generation failed:', error);
		return '';
	}
}

// Store connected devtools ports
const devToolsPorts: chrome.runtime.Port[] = [];

// Function to broadcast messages to all connected devtools panels
function broadcastToDevTools(data: {messages: any[] | null, httpMessages: any[] | null}) {
	devToolsPorts.forEach(port => {
		port.postMessage(data);
	});
}

chrome.debugger.onDetach.addListener(function(debuggeeId, reason) {
	chrome.storage.local.set({ websocketMessages: [], httpMessages: [] });
});

chrome.runtime.onConnect.addListener(function(port) {
	if (port.name === 'devtools') {
		// Add to connected ports
		devToolsPorts.push(port);
		
		port.onDisconnect.addListener(function() {
			// Remove from connected ports
			const index = devToolsPorts.indexOf(port);
			if (index !== -1) {
				devToolsPorts.splice(index, 1);
			}
		});

		port.onMessage.addListener(function(request) {
			if (request.action === 'attachDebugger') {
				chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
					if (tabs[0]) {
						chrome.debugger.attach({ tabId: tabs[0].id }, '1.3', function() {
							chrome.debugger.sendCommand({ tabId: tabs[0].id }, 'Network.enable');
							chrome.debugger.sendCommand({ tabId: tabs[0].id }, 'Network.setExtraHTTPHeaders', {
								headers: { 'X-DevTools-Emulate-Network-Conditions': 'true' }
							});
						});
					}
				});
			} else if (request.action === 'getMessages') {
				chrome.storage.local.get([ 'websocketMessages', 'httpMessages' ], function(result) {
					port.postMessage({
						messages: result.websocketMessages || [],
						httpMessages: result.httpMessages || [] 
					});
				});
			} else if (request.action === 'clearMessages') {
				chrome.storage.local.set({ websocketMessages: [], httpMessages: [] });
				// Broadcast empty messages to all connected devtools panels
				broadcastToDevTools({
					messages: [],
					httpMessages: []
				});
			}
		});
	}
});
