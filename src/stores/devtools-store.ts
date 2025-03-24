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
	port: Browser.Runtime.Port | null = null;

	constructor() {
		super();
		makeObservable(this, {
			messages: observable,
			httpMessages: observable,
			port: observable,
			reversedMessages: computed,
			reversedHttpMessages: computed,
			combinedMessages: computed,
			connectToDevTools: action,
			setMessages: action,
			setHttpMessages: action,
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
		const wsMessages = this.messages.map((msg) => ({ ...msg, type: MessageType.WebSocket }));
		const httpMsgs = this.httpMessages.map((msg) => ({ ...msg, type: MessageType.Http }));

		return [ ...wsMessages, ...httpMsgs ].sort((a, b) => a.hash.localeCompare(b.hash)).reverse();
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
			this.setMessages(message.messages);
		}

		if (message.httpMessages) {
			this.setHttpMessages(message.httpMessages);
		}
	};

	setMessages(messages: Message[]) {
		this.messages = messages;
	}

	setHttpMessages(messages: Message[]) {
		this.httpMessages = messages;
	}

	clearMessages() {
		if (this.port) {
			this.port.postMessage({ action: 'clearMessages' });
		}
	}
}
