import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/routes";
import {
  ApiResponse,
  ChangePasswordPayload,
  UpdateProfilePayload,
  UserProfile,
} from "@/types";

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>(
      API_ENDPOINTS.PROFILE.VIEW
    );
    if (!response.data.data) {
      throw new Error("Profile data not found");
    }
    return response.data.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const response = await apiClient.patch<ApiResponse<UserProfile>>(
      API_ENDPOINTS.PROFILE.EDIT,
      payload
    );
    if (!response.data.data) {
      throw new Error("Failed to update profile");
    }
    return response.data.data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<string> {
    const response = await apiClient.patch<
      ApiResponse<{ message?: string }>
    >(API_ENDPOINTS.PROFILE.PASSWORD, payload);
    return (
      response.data.data?.message ||
      response.data.message ||
      "Password updated successfully"
    );
  },
};
