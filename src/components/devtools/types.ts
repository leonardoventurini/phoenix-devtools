export interface Message {
	method: string;
	data: string;
	hash: string;
	type?: 'websocket' | 'http';
	isPhoenix?: boolean;
}

export interface PortResponse {
	messages?: Message[];
	httpMessages?: Message[];
	connections?: any[];
}
