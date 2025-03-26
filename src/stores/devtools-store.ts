import { observable, action, computed, makeObservable, runInAction } from 'mobx';
import Browser from 'webextension-polyfill';
import { BaseStore } from './base-store';
import { Message, MessageDirection, MessageType } from '../components/devtools/types';
import { debounce } from 'lodash';

export class DevToolsStore extends BaseStore {
	@observable messages: Message[] = [];
	@observable connections: any[] = [];
	@observable port: Browser.Runtime.Port | null = null;
	buffer: Message[] = [];
	@observable newMessages: string[] = [];
	@observable inboundBytes = 0;
	@observable outboundBytes = 0;

	constructor() {
		super();
		makeObservable(this);
	}

	@computed
	get reversedMessages() {
		return [ ...this.messages ].reverse();
	}

	@computed
	get websocketMessages() {
		return this.messages.filter((msg) => msg.type === MessageType.WebSocket);
	}

	@computed
	get httpMessages() {
		return this.messages.filter((msg) => msg.type === MessageType.Http);
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
			const processedMessages = message.messages
				.map((msg: Message) => {
					return { ...msg, isPhoenix: this.isPhoenixMessage(msg) };
				})
				.sort((a: Message, b: Message) => a.timestamp - b.timestamp);

			this.buffer.push(...processedMessages);
			this.submitLogs();
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
	setConnections(connections: any[]) {
		this.connections = connections;
	}

	@action
	clearMessages() {
		if (this.port) {
			this.port.postMessage({ action: 'clearMessages' });
			this.messages = [];
		}
	}

	submitLogs = debounce(
		action(() => {
			this._submitLogs();
		}),
		100,
		{
			maxWait: 1000
		}
	);

	@action
	_submitLogs() {
		if (this.bufferCallback) {
			this.bufferCallback(this.buffer);
		}

		this.messages.push(...this.buffer);

		this.buffer = [];
	}

	bufferCallback = (buffer: Message[]) => {
		this.buffer = buffer;

		this.newMessages.push(...buffer.map(({ hash }) => hash));

		this.inboundBytes += buffer
			.filter((message) => message.direction === MessageDirection.Inbound)
			.reduce((sum, message) => sum + (message.size || 0), 0);

		this.outboundBytes += buffer
			.filter((message) => message.direction === MessageDirection.Outbound)
			.reduce((sum, message) => sum + (message.size || 0), 0);

		this.clearNewLogs();
	};

	clearNewLogs = debounce(() => {
		runInAction(() => {
			this.newMessages = [];
		});
	}, 1000);
}
