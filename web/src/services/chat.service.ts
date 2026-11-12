import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/routes";
import { ApiResponse, ChatSession } from "@/types";

export const chatService = {
  async getChatHistory(targetUserId: string): Promise<ChatSession> {
    const response = await apiClient.get<ApiResponse<ChatSession>>(
      API_ENDPOINTS.CHAT.HISTORY(targetUserId)
    );
    return (
      response.data.data ?? {
        _id: "",
        participants: [],
        messages: [],
      }
    );
  },
};
