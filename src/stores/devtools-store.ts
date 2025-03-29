import { observable, action, computed, makeObservable, runInAction } from 'mobx';
import Browser from 'webextension-polyfill';
import { BaseStore } from './base-store';
import { Message, MessageDirection, MessageType } from '../components/devtools/types';
import { debounce } from 'lodash';

// Define a type for the direction filter options
export type DirectionFilterType = 'all' | 'inbound' | 'outbound';

export class DevToolsStore extends BaseStore {
	@observable messages: Message[] = [];
	@observable connections: any[] = [];
	@observable port: Browser.Runtime.Port | null = null;
	buffer: Message[] = [];
	@observable newMessages: string[] = [];
	@observable inboundBytes = 0;
	@observable outboundBytes = 0;
	@observable searchTerm: string = '';
	@observable showPhoenixOnly: boolean = false;
	@observable directionFilter: DirectionFilterType = 'all';

	constructor() {
		super();
		makeObservable(this);
	}

	@computed
	get reversedMessages() {
		return [ ...this.filteredMessages ].reverse();
	}

	@computed
	get websocketMessages() {
		return this.messages.filter((msg) => msg.type === MessageType.WebSocket);
	}

	@computed
	get httpMessages() {
		return this.messages.filter((msg) => msg.type === MessageType.Http);
	}

	@computed
	get filteredMessages() {
		let filtered = this.messages;

		// Apply Phoenix filter if enabled
		if (this.showPhoenixOnly) {
			filtered = filtered.filter((message) => message.isPhoenix);
		}

		// Apply direction filter
		if (this.directionFilter !== 'all') {
			filtered = filtered.filter(
				(message) =>
					this.directionFilter === 'inbound'
						? message.direction === MessageDirection.Inbound
						: message.direction === MessageDirection.Outbound
			);
		}

		if (!this.searchTerm.trim()) {
			return filtered;
		}

		const normalizedSearchTerm = this.normalizeText(this.searchTerm.trim().toLowerCase());

		return filtered.filter((message) => {
			// Create a searchable string from all message fields
			const searchString = this.createSearchString(message);
			const normalizedSearchString = this.normalizeText(searchString);

			// Perform simple substring search (case insensitive and ignoring diacritics)
			return this.performSearch(normalizedSearchString, normalizedSearchTerm);
		});
	}

	// Normalize text by removing diacritics
	private normalizeText(text: string): string {
		return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	}

	// Create a searchable string from all message fields
	private createSearchString(message: Message): string {
		let searchParts = [
			message.method,
			message.data,
			message.type,
			message.direction,
			message.isPhoenix ? 'phoenix' : '',
			new Date(message.timestamp).toLocaleString()
		];

		// Try to extract more data from JSON if possible
		try {
			if (message.data) {
				const jsonData = JSON.parse(message.data);
				const jsonString = JSON.stringify(jsonData);
				searchParts.push(jsonString);
			}
		} catch (e) {
			// Not JSON, continue without parsing
		}

		return searchParts.filter(Boolean).join(' ').toLowerCase();
	}

	// Simple substring search implementation that supports multiple terms
	private performSearch(text: string, query: string): boolean {
		// Direct match
		if (text.includes(query)) {
			return true;
		}

		// Support for multiple search terms (space-separated)
		const terms = query.split(/\s+/);
		if (terms.length > 1) {
			return terms.every((term) => text.includes(term));
		}

		return false;
	}

	@action
	setSearchTerm(term: string) {
		this.searchTerm = term;
	}

	@action
	togglePhoenixFilter() {
		this.showPhoenixOnly = !this.showPhoenixOnly;
	}

	@action
	setDirectionFilter(filter: DirectionFilterType) {
		this.directionFilter = filter;
	}

	// Detect Phoenix messages by checking the message content or associated connection
	private isPhoenixMessage(message: Message): boolean {
		// If the message is already marked as Phoenix, return true
		if (message.isPhoenix) {
			return true;
		}
		
		// If it's an HTTP message with method prefixed with 'HTTP.' that was detected as Phoenix by the content script
		if (message.type === MessageType.Http && 
			(message.method.startsWith('HTTP.'))) {
			return true;
		}
		
		// Try to detect Phoenix message by its content structure for WebSocket messages
		if (message.type === MessageType.WebSocket) {
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
		}
		
		// For HTTP messages, try to check if this is related to Phoenix
		if (message.type === MessageType.Http) {
			try {
				// Try to parse the data
				const data = JSON.parse(message.data);
				
				// For request or response with URL patterns related to Phoenix
				const url = data.url || (data.request && data.request.url) || (data.response && data.response.url);
				
				if (url && typeof url === 'string') {
					if (url.includes('/live') || 
						url.includes('/phoenix') || 
						url.includes('/socket') ||
						url.includes('/user_socket') ||
						url.endsWith('/websocket')) {
						return true;
					}
				}
				
				// Check for Phoenix-related headers
				const headers = data.headers || 
					(data.request && data.request.headers) || 
					(data.response && data.response.headers);
				
				if (headers) {
					const headerString = JSON.stringify(headers).toLowerCase();
					if (headerString.includes('phx-') || 
						headerString.includes('_csrf_token') || 
						headerString.includes('live_socket_id')) {
						return true;
					}
				}
				
				// Check for known Phoenix response patterns in body
				const body = data.body || 
					(data.request && data.request.body) || 
					(data.response && data.response.body);
				
				if (body && typeof body === 'string') {
					if (body.includes('phx-') || 
						body.includes('data-phx') || 
						body.includes('LiveView') ||
						body.includes('_csrf_token') ||
						body.includes('phx:page-loading')) {
						return true;
					}
				}
			} catch (e) {
				// Not JSON or couldn't parse, can't determine if it's Phoenix-related
			}
		}
		
		// No Phoenix indicator found
		return false;
	}

	@action
	connectToDevTools() {
		// Reset state on connect
		this.port = Browser.runtime.connect({ name: 'devtools' });
		this.messages = [];

		console.log('DevTools connected');

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
		console.log('Received message from background:', JSON.stringify(message));

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
