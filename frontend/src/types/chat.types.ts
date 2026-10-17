export interface ChatMessage {
  _id?: string;
  senderId: string;
  firstName?: string;
  text: string;
  createdAt: string;
}

export interface ChatSession {
  _id: string;
  participants: string[];
  messages: ChatMessage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface JoinChatEventPayload {
  targetUserId: string;
}

export interface SendMessageEventPayload {
  targetUserId: string;
  text: string;
}

export interface MessageReceivedEventPayload {
  senderId: string;
  firstName: string;
  text: string;
  createdAt: string;
}
