import { Message } from '../../components/devtools/types';

const MAX_MESSAGES = 10000;

// Store connected devtools ports
const devToolsPorts: chrome.runtime.Port[] = [];

// Function to broadcast messages to all connected devtools panels
function broadcastToDevTools(data: {
	messages?: Message[] | null;
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

chrome.runtime.onConnect.addListener(function(port) {
	if (port.name === 'devtools') {
		// Add to connected ports
		devToolsPorts.push(port);

		// Send current messages
		chrome.storage.local.get(['messages', 'websocketConnections'], function(result) {
			if (result.messages) {
				port.postMessage({ messages: result.messages });
			}
			
			if (result.websocketConnections) {
				port.postMessage({ connections: result.websocketConnections });
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
			if (request.action === 'getMessages') {
				// Retrieve and send all stored messages and connections
				chrome.storage.local.get(['messages', 'websocketConnections'], function(result) {
					if (result.messages) {
						port.postMessage({ messages: result.messages });
					}
					
					if (result.websocketConnections) {
						port.postMessage({ connections: result.websocketConnections });
					}
				});
			} else if (request.action === 'clearMessages') {
				// Clear all stored messages
				chrome.storage.local.set({
					messages: [],
					websocketConnections: []
				});
				
				// Broadcast empty message list to all devtools panels
				broadcastToDevTools({
					messages: [],
					connections: []
				});
			}
		});
	}
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.action === 'phoenix-message' && request.message) {
		// Hash the message
		hashMessage(JSON.stringify(request.message)).then((messageHash) => {
			// Add the hash to the message
			const message = {
				...request.message,
				hash: messageHash
			};

			// Store in local storage
			chrome.storage.local.get(['messages'], function(result) {
				let messages = result.messages || [];
				messages.push(message);

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
	} else if (request.action === 'phoenix-connection-info' && request.connectionInfo) {
		// Store Phoenix connection info
		const connectionInfo = {
			...request.connectionInfo,
			tabId: sender.tab?.id,
			timestamp: Date.now(),
			isPhoenix: true
		};

		// Hash and store connection
		hashMessage(JSON.stringify(connectionInfo)).then((connectionHash) => {
			chrome.storage.local.get(['websocketConnections'], function(result) {
				let connections = result.websocketConnections || [];
				
				// Replace if same tab connection exists, add otherwise
				const tabIndex = connections.findIndex((conn: any) => conn.tabId === connectionInfo.tabId);
				if (tabIndex !== -1) {
					connections[tabIndex] = { ...connectionInfo, hash: connectionHash };
				} else {
					connections.push({ ...connectionInfo, hash: connectionHash });
				}
				
				chrome.storage.local.set({ websocketConnections: connections });

				// Broadcast connection info to devtools
				broadcastToDevTools({
					connections,
					messages: null
				});
			});
		});
	} else if (request.action === 'phoenix-channels-updated' && request.channels) {
		// Update channels for the current connection
		chrome.storage.local.get(['websocketConnections'], function(result) {
			let connections = result.websocketConnections || [];
			
			// Find the connection for this tab
			const tabIndex = connections.findIndex((conn: any) => conn.tabId === sender.tab?.id);
			if (tabIndex !== -1) {
				// Update the channels
				connections[tabIndex].channels = request.channels;
				chrome.storage.local.set({ websocketConnections: connections });
				
				// Broadcast updated connections
				broadcastToDevTools({
					connections,
					messages: null
				});
			}
		});
	}
});
