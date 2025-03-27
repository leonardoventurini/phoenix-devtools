import { Message, MessageType, MessageDirection } from '../../components/devtools/types';

const MAX_MESSAGES = 10000;

chrome.debugger.onEvent.addListener(function(debuggeeId, method, params: any) {
	if (method === 'Network.webSocketFrameReceived' || method === 'Network.webSocketFrameSent') {
		let data = params.response ? params.response.payloadData : params.request.data;
		hashMessage(method + data).then((messageHash) => {
			chrome.storage.local.get([ 'messages' ], function(result) {
				let messages = result.messages || [];
				messages.push({
					method,
					data,
					hash: messageHash,
					type: MessageType.WebSocket,
					direction:
						method === 'Network.webSocketFrameReceived'
							? MessageDirection.Inbound
							: MessageDirection.Outbound,
					size: new TextEncoder().encode(data).length,
					timestamp: Date.now()
				});

				if (messages.length > MAX_MESSAGES) {
					messages = messages.slice(-MAX_MESSAGES);
				}

				chrome.storage.local.set({ messages });

				// Broadcast to all connected devtools panels
				broadcastToDevTools({
					messages,
					connections: null
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
			// Phoenix sockets typically use paths like /socket, /live, /phoenix, or end with /websocket
			if (
				url.includes('/socket') ||
				url.includes('/live') ||
				url.includes('/phoenix') ||
				url.includes('/user_socket') ||
				url.endsWith('/websocket')
			) {
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
					connections,
					messages: null
				});
			});
		});
	} else if (method === 'Network.requestWillBeSent' || method === 'Network.responseReceived') {
		const data = {
			request: method === 'Network.requestWillBeSent' ? params.request : undefined,
			response: method === 'Network.responseReceived' ? params.response : undefined,
			requestId: params.requestId,
			timestamp: Math.floor(params.timestamp * 1000),
			type: params.type
		};

		const stringifiedData = JSON.stringify(data);
		hashMessage(method + stringifiedData).then((messageHash) => {
			chrome.storage.local.get([ 'messages' ], function(result) {
				let messages = result.messages || [];
				messages.push({
					method,
					data: stringifiedData,
					hash: messageHash,
					type: MessageType.Http,
					direction:
						method === 'Network.requestWillBeSent' ? MessageDirection.Outbound : MessageDirection.Inbound,
					size: new TextEncoder().encode(stringifiedData).length,
					timestamp: Date.now()
				});

				if (messages.length > MAX_MESSAGES) {
					messages = messages.slice(-MAX_MESSAGES);
				}

				chrome.storage.local.set({ messages });

				// Broadcast to all connected devtools panels
				broadcastToDevTools({
					messages,
					connections: null
				});
			});
		});
	}
});

// Store connected devtools ports
const devToolsPorts: chrome.runtime.Port[] = [];

// Function to broadcast messages to all connected devtools panels
function broadcastToDevTools(data: {
	messages?: Message[] | null;
	connections?: any[] | null;
	debuggerStatus?: 'attached' | 'detached';
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
		messages: [],
		websocketConnections: []
	});

	// Broadcast debugger status to all devtools panels
	broadcastToDevTools({
		debuggerStatus: 'detached'
	});
});

chrome.runtime.onConnect.addListener(function(port) {
	if (port.name === 'devtools') {
		// Add to connected ports
		devToolsPorts.push(port);

		// Check if debugger is already attached to the current tab
		chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
			if (tabs[0]) {
				try {
					// More reliable way to check if debugger is attached
					chrome.debugger.sendCommand(
						{ tabId: tabs[0].id },
						'Runtime.evaluate',
						{ expression: '1+1' },
						function(result) {
							// If this succeeds, debugger is attached
							if (chrome.runtime.lastError) {
								console.log('Debugger not attached (error):', chrome.runtime.lastError);
								port.postMessage({ debuggerStatus: 'detached' });
							} else {
								console.log('Debugger is attached');
								port.postMessage({ debuggerStatus: 'attached' });
							}
						}
					);
				} catch (e) {
					// If an exception occurs, debugger is not attached
					console.log('Debugger check exception:', e);
					port.postMessage({ debuggerStatus: 'detached' });
				}
			} else {
				// If no active tab is found, assume debugger is not attached
				port.postMessage({ debuggerStatus: 'detached' });
			}
		});

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
						try {
							chrome.debugger.attach({ tabId: tabs[0].id }, '1.3', function() {
								if (chrome.runtime.lastError) {
									console.error('Error attaching debugger:', chrome.runtime.lastError);
									port.postMessage({ debuggerStatus: 'detached' });
									return;
								}

								console.log('Debugger attached successfully');

								chrome.debugger.sendCommand({ tabId: tabs[0].id }, 'Network.enable', {}, function() {
									if (chrome.runtime.lastError) {
										console.error('Error enabling Network:', chrome.runtime.lastError);
									}
								});

								chrome.debugger.sendCommand(
									{ tabId: tabs[0].id },
									'Network.setExtraHTTPHeaders',
									{ headers: { 'X-DevTools-Emulate-Network-Conditions': 'true' } },
									function() {
										if (chrome.runtime.lastError) {
											console.error('Error setting headers:', chrome.runtime.lastError);
										}
									}
								);

								// Notify port about debugger status
								port.postMessage({ debuggerStatus: 'attached' });
							});
						} catch (e) {
							console.error('Exception attaching debugger:', e);
							port.postMessage({ debuggerStatus: 'detached' });
						}
					} else {
						console.error('No active tab found for attaching debugger');
						port.postMessage({ debuggerStatus: 'detached' });
					}
				});
			} else if (request.action === 'detachDebugger') {
				chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
					if (tabs[0]) {
						try {
							chrome.debugger.detach({ tabId: tabs[0].id }, function() {
								if (chrome.runtime.lastError) {
									console.error('Error detaching debugger:', chrome.runtime.lastError);
								} else {
									console.log('Debugger detached successfully');
								}
								// Always notify port that debugger is detached, even if there was an error
								port.postMessage({ debuggerStatus: 'detached' });
							});
						} catch (e) {
							console.error('Exception detaching debugger:', e);
							port.postMessage({ debuggerStatus: 'detached' });
						}
					} else {
						console.error('No active tab found for detaching debugger');
						port.postMessage({ debuggerStatus: 'detached' });
					}
				});
			} else if (request.action === 'getMessages') {
				chrome.storage.local.get([ 'messages', 'websocketConnections' ], function(result) {
					port.postMessage({
						messages: result.messages || [],
						connections: result.websocketConnections || []
					});
				});
			} else if (request.action === 'clearMessages') {
				chrome.storage.local.set({
					messages: [],
					websocketConnections: []
				});
				// Broadcast empty messages to all connected devtools panels
				broadcastToDevTools({
					messages: [],
					connections: []
				});
			}
		});
	}
});
