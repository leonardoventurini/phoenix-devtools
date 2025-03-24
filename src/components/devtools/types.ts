export interface Message {
	method: string;
	data: string;
	hash: string;
	type?: 'websocket' | 'http';
}

export interface PortResponse {
	messages?: Message[];
	httpMessages?: Message[];
}

export type ActiveTab = 'websocket' | 'http' | 'all';
