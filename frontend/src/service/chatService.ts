import api from "../config/axios";
import type { ApiResponse } from "../types/ApiResponse";
import type {
  ConversationResponse,
  MessageRequest,
  MessageResponse,
} from "../types/chat.ts";

const chatService = {
  getUserConversations: async (): Promise<
    ApiResponse<ConversationResponse[]>
  > => {
    const response = await api.get<ApiResponse<ConversationResponse[]>>(
      `/chat/conversations`,
    );
    return response.data;
  },

  getMessages: async (
    conversationId: string,
    page: number = 0,
    size: number = 20,
  ): Promise<ApiResponse<MessageResponse[]>> => {
    const response = await api.get<ApiResponse<MessageResponse[]>>(
      `/chat/history/${conversationId}`,
      {
        params: { page, size },
      },
    );
    return response.data;
  },

  getConversation: async (
    conversationId: string,
  ): Promise<ApiResponse<ConversationResponse>> => {
    const response = await api.get<ApiResponse<ConversationResponse>>(
      `/chat/conversation/${conversationId}`,
    );
    return response.data;
  },

  markMessageAsRead: async (
    conversationId: string,
    userId: string,
  ): Promise<ApiResponse<void>> => {
    const response = await api.patch<ApiResponse<void>>(
      `/chat/conversations/${conversationId}/read`,
      null,
      {
        params: { userId },
      },
    );
    return response.data;
  },

  sendMessageWithImage: async (
    request: MessageRequest,
    file?: File,
  ): Promise<ApiResponse<MessageResponse>> => {
    const formData = new FormData();

    formData.append(
      "data",
      new Blob([JSON.stringify(request)], { type: "application/json" }),
    );

    if (file) {
      formData.append("file", file);
    }

    const response = await api.post<ApiResponse<MessageResponse>>(
      `/chat/send-with-image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
};

export default chatService;
