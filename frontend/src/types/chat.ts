export interface MessageRequest {
    conversationId?: string;
    receiverId: string;
    content: string;
}

export interface UserChatResponse {
    userId: string;
    userName: string;
    avatar?: string;
}

export interface MessageResponse {
    messageId: string;
    conversationId: string;
    content: string;
    senderName: string;
    senderId: string;
    createdAt: string;
    status: "SENT" | "DELIVERED" | "READ";
    readAt?: string;
    imageUrl: string | null;
}

export interface ConversationResponse {
    conversationId: string | null;
    lastMessage: string;
    lastSenderName: string;
    user1: UserChatResponse;
    user2: UserChatResponse;
    updatedAt: string;
    isRead?: boolean;
}