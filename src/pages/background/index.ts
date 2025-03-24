chrome.debugger.onEvent.addListener(function(debuggeeId, method, params: any) {
	if (method === 'Network.webSocketFrameReceived' || method === 'Network.webSocketFrameSent') {
		let data = params.response ? params.response.payloadData : params.request.data;
		hashMessage(method + data).then((messageHash) => {
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
	} else if (method === 'Network.webSocketCreated' || method === 'Network.webSocketHandshakeResponseReceived') {
		// Track WebSocket connection information to identify Phoenix connections
		const connectionInfo = {
			method,
			requestId: params.requestId,
			url: params.url || (params.response && params.response.url),
			timestamp: Date.now(),
			isPhoenix: false
		};

		// Check if this is a Phoenix connection based on URL patterns
		if (connectionInfo.url) {
			const url = connectionInfo.url.toLowerCase();
			// Phoenix sockets typically use paths like /socket, /live, or /phoenix
			if (url.includes('/socket') || url.includes('/live') || url.includes('/phoenix')) {
				connectionInfo.isPhoenix = true;
			}
		}

		// Store connection information
		hashMessage(JSON.stringify(connectionInfo)).then((connectionHash) => {
			chrome.storage.local.get([ 'websocketConnections' ], function(result) {
				let connections = result.websocketConnections || [];
				connections.push({ ...connectionInfo, hash: connectionHash });
				chrome.storage.local.set({ websocketConnections: connections });

				// Broadcast connection info to devtools
				broadcastToDevTools({
					connections: connections,
					messages: null,
					httpMessages: null
				});
			});
		});
	} else if (method === 'Network.requestWillBeSent' || method === 'Network.responseReceived') {
		const stringifiedData = JSON.stringify(params);
		hashMessage(method + stringifiedData).then((messageHash) => {
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

// Store connected devtools ports
const devToolsPorts: chrome.runtime.Port[] = [];

// Function to broadcast messages to all connected devtools panels
function broadcastToDevTools(data: {
	messages?: any[] | null;
	httpMessages?: any[] | null;
	connections?: any[] | null;
}) {
	devToolsPorts.forEach((port) => {
		port.postMessage(data);
	});
}

// Function to hash messages to create unique identifiers
async function hashMessage(message: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(message);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}

chrome.debugger.onDetach.addListener(function(debuggeeId, reason) {
	chrome.storage.local.set({
		websocketMessages: [],
		httpMessages: [],
		websocketConnections: []
	});
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
				chrome.storage.local.get([ 'websocketMessages', 'httpMessages', 'websocketConnections' ], function(
					result
				) {
					port.postMessage({
						messages: result.websocketMessages || [],
						httpMessages: result.httpMessages || [],
						connections: result.websocketConnections || []
					});
				});
			} else if (request.action === 'clearMessages') {
				chrome.storage.local.set({
					websocketMessages: [],
					httpMessages: [],
					websocketConnections: []
				});
				// Broadcast empty messages to all connected devtools panels
				broadcastToDevTools({
					messages: [],
					httpMessages: [],
					connections: []
				});
			}
		});
	}
});
