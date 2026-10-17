import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/routes";
import { APP_CONFIG } from "@/config/env";
import {
  ApiResponse,
  ConnectionItem,
  ConnectionRequest,
  PaginationParams,
  ReceivedConnectionRequest,
  ReviewStatus,
  SwipeStatus,
  UserProfile,
} from "@/types";

export const matchingService = {
  async getDiscoveryFeed(params?: PaginationParams): Promise<UserProfile[]> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? APP_CONFIG.DEFAULT_FEED_LIMIT;

    const response = await apiClient.get<ApiResponse<UserProfile[]>>(
      API_ENDPOINTS.MATCHING.FEED,
      { params: { page, limit } }
    );
    return response.data.data ?? [];
  },

  async sendConnectionRequest(
    status: SwipeStatus,
    toUserId: string
  ): Promise<ConnectionRequest> {
    const response = await apiClient.post<ApiResponse<ConnectionRequest>>(
      API_ENDPOINTS.MATCHING.SEND_REQUEST(status, toUserId)
    );
    return response.data.data as ConnectionRequest;
  },

  async reviewConnectionRequest(
    status: ReviewStatus,
    requestId: string
  ): Promise<ConnectionRequest> {
    const response = await apiClient.post<ApiResponse<ConnectionRequest>>(
      API_ENDPOINTS.MATCHING.REVIEW_REQUEST(status, requestId)
    );
    return response.data.data as ConnectionRequest;
  },

  async getReceivedRequests(): Promise<ReceivedConnectionRequest[]> {
    const response = await apiClient.get<
      ApiResponse<ReceivedConnectionRequest[]>
    >(API_ENDPOINTS.MATCHING.RECEIVED_REQUESTS);
    return response.data.data ?? [];
  },

  async getConnections(): Promise<ConnectionItem[]> {
    const response = await apiClient.get<ApiResponse<ConnectionItem[]>>(
      API_ENDPOINTS.MATCHING.CONNECTIONS
    );
    return response.data.data ?? [];
  },
};
