export interface Message {
  method: string
  data: string
  hash: string
  type: MessageType
  direction: MessageDirection
  size: number
  isPhoenix?: boolean
  timestamp: number
  parsedData?: string
  tabId?: number
}

export enum MessageType {
  WebSocket = 'websocket',
  Http = 'http',
}

export enum MessageDirection {
  Inbound = 'inbound',
  Outbound = 'outbound',
}

export interface PhoenixConnection {
  tabId?: number
  timestamp: number
  isPhoenix: boolean
  hash: string
  channels?: Array<{
    topic: string
    joinedOnce: boolean
    state: string
  }>
  phxVersion?: string
  params?: Record<string, unknown>
  url?: string
}

export interface PortResponse {
  messages: Message[]
  connections?: PhoenixConnection[]
}
