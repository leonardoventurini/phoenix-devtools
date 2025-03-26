export interface Message {
	method: string;
	data: string;
	hash: string;
	type: MessageType;
	direction: MessageDirection;
	size: number;
	isPhoenix?: boolean;
	timestamp: number;
}

export enum MessageType {
	WebSocket = 'websocket',
	Http = 'http'
}

export enum MessageDirection {
	Inbound = 'inbound',
	Outbound = 'outbound'
}

export interface PortResponse {
	messages: Message[];
	connections?: any[];
}
