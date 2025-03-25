import { observable, action, computed, makeObservable } from 'mobx';
import Browser from 'webextension-polyfill';
import { BaseStore } from './base-store';
import { Message } from '../components/devtools/types';

export enum MessageType {
	WebSocket = 'websocket',
	Http = 'http'
}

export class DevToolsStore extends BaseStore {
	@observable messages: Message[] = [];
	@observable httpMessages: Message[] = [];
	@observable connections: any[] = [];
	@observable port: Browser.Runtime.Port | null = null;

	constructor() {
		super();
		makeObservable(this);
	}

	@computed
	get reversedMessages() {
		return this.messages.reverse();
	}

	@computed
	get reversedHttpMessages() {
		return this.httpMessages.reverse();
	}

	@computed
	get combinedMessages() {
		const wsMessages = this.messages.map((msg) => {
			// Detect Phoenix messages
			const isPhoenix = this.isPhoenixMessage(msg);
			return { ...msg, type: MessageType.WebSocket, isPhoenix };
		});

		const httpMsgs = this.httpMessages.map((msg) => ({ ...msg, type: MessageType.Http }));

		return [ ...wsMessages, ...httpMsgs ].sort((a, b) => a.hash.localeCompare(b.hash)).reverse();
	}

	// Detect Phoenix messages by checking the message content or associated connection
	private isPhoenixMessage(message: Message): boolean {
		// Try to detect Phoenix message by its content structure
		try {
			// First, try to parse the message
			const data = JSON.parse(message.data);

			// Check for Phoenix array format: ["3","3","phoenix:live_reload","phx_join",{}]
			if (Array.isArray(data)) {
				// Phoenix messages as arrays typically have a topic in position 2 and event in position 3
				if (data.length >= 4) {
					const topic = data[2];
					const event = data[3];

					// Check for known Phoenix patterns
					if (
						// Handle both string topics and check phoenix directly
						(typeof topic === 'string' && (topic.includes('phoenix') || topic.startsWith('lv:'))) ||
						// Handle case where "phoenix" is the direct channel/topic name
						topic === 'phoenix'
					) {
						return true;
					}

					// Check for Phoenix events (regardless of topic)
					if (typeof event === 'string' && (event.startsWith('phx_') || event === 'heartbeat')) {
						return true;
					}
				}
			}

			// Continue with the existing object format checks
			// Phoenix messages typically have topic, event, payload, and ref fields
			if (data.topic && data.event && data.payload !== undefined && data.ref !== undefined) {
				return true;
			}

			// Phoenix events have specific names like phx_join, phx_reply, phx_error, etc.
			if (
				data.event &&
				typeof data.event === 'string' &&
				(data.event.startsWith('phx_') || data.event.includes('phoenix'))
			) {
				return true;
			}

			// Check for Phoenix LiveView specific message patterns
			if (
				data.event === 'live_patch' ||
				data.event === 'live_redirect' ||
				(data.topic && data.topic.startsWith('lv:'))
			) {
				return true;
			}
		} catch (e) {
			// Not JSON or couldn't parse - continue with URL-based checks
		}

		// If we have connection info, check if this message is from a Phoenix socket
		if (this.connections.length > 0) {
			// In a real implementation, we would have a way to associate messages with connections
			// This is a placeholder for that logic
			const isFromPhoenixConnection = this.connections.some((conn) => conn.isPhoenix);
			if (isFromPhoenixConnection) {
				return true;
			}
		}

		return false;
	}

	@action
	connectToDevTools() {
		this.port = Browser.runtime.connect({ name: 'devtools' });

		this.port.postMessage({ action: 'attachDebugger' });
		this.port.postMessage({ action: 'getMessages' });

		this.port.onMessage.addListener(this.handlePortMessage);

		return () => {
			if (this.port) {
				this.port.onMessage.removeListener(this.handlePortMessage);
				this.port.disconnect();
				this.port = null;
			}
		};
	}

	private handlePortMessage = (message: any) => {
		if (message.messages) {
			// Process and add isPhoenix flag to messages
			const processedMessages = message.messages.map((msg: Message) => {
				return { ...msg, isPhoenix: this.isPhoenixMessage(msg) };
			});
			this.setMessages(processedMessages);
		}

		if (message.httpMessages) {
			this.setHttpMessages(message.httpMessages);
		}

		if (message.connections) {
			this.setConnections(message.connections);
		}
	};

	@action
	setMessages(messages: Message[]) {
		this.messages = messages;
	}

	@action
	setHttpMessages(messages: Message[]) {
		this.httpMessages = messages;
	}

	@action
	setConnections(connections: any[]) {
		this.connections = connections;
	}

	@action
	clearMessages() {
		if (this.port) {
			this.port.postMessage({ action: 'clearMessages' });
		}
	}
}
