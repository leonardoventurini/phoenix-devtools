import { makeObservable, observable, action, computed } from 'mobx';
import Browser from 'webextension-polyfill';
import { BaseStore } from './base-store';
import { Message } from '../components/devtools/types';

export enum MessageType {
	WebSocket = 'websocket',
	Http = 'http'
}

export class DevToolsStore extends BaseStore {
	messages: Message[] = [];
	httpMessages: Message[] = [];
	connections: any[] = [];
	port: Browser.Runtime.Port | null = null;

	constructor() {
		super();
		makeObservable(this, {
			messages: observable,
			httpMessages: observable,
			connections: observable,
			port: observable,
			reversedMessages: computed,
			reversedHttpMessages: computed,
			combinedMessages: computed,
			connectToDevTools: action,
			setMessages: action,
			setHttpMessages: action,
			setConnections: action,
			clearMessages: action
		});
	}

	get reversedMessages() {
		return [ ...this.messages ].reverse();
	}

	get reversedHttpMessages() {
		return [ ...this.httpMessages ].reverse();
	}

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
			const data = JSON.parse(message.data);

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
			console.log('connections', message.connections);
			this.setConnections(message.connections);
		}
	};

	setMessages(messages: Message[]) {
		this.messages = messages;
	}

	setHttpMessages(messages: Message[]) {
		this.httpMessages = messages;
	}

	setConnections(connections: any[]) {
		this.connections = connections;
	}

	clearMessages() {
		if (this.port) {
			this.port.postMessage({ action: 'clearMessages' });
		}
	}
}
