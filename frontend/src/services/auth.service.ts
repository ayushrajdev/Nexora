import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/routes";
import { ENV } from "@/config/env";
import {
  ApiResponse,
  AuthResponseData,
  LoginCredentials,
  SignupPayload,
  UserProfile,
} from "@/types";

/**
 * Extracts the `UserProfile` object safely regardless of minor envelope variations.
 */
function extractUserFromAuthResponse(
  payload: ApiResponse<AuthResponseData | UserProfile | string> & {
    message?: unknown;
  }
): UserProfile {
  if (
    payload.data &&
    typeof payload.data === "object" &&
    "user" in payload.data
  ) {
    return (payload.data as AuthResponseData).user;
  }
  if (
    payload.data &&
    typeof payload.data === "object" &&
    "_id" in payload.data
  ) {
    return payload.data as UserProfile;
  }
  if (
    payload.message &&
    typeof payload.message === "object" &&
    "user" in (payload.message as Record<string, unknown>)
  ) {
    return (payload.message as AuthResponseData).user;
  }
  throw new Error("Invalid authentication response from server");
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<UserProfile> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    return extractUserFromAuthResponse(response.data);
  },

  async signup(payload: SignupPayload): Promise<UserProfile> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>(
      API_ENDPOINTS.AUTH.SIGNUP,
      payload
    );
    return extractUserFromAuthResponse(response.data);
  },

  async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  getGoogleOAuthUrl(): string {
    return `${ENV.API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE_OAUTH}`;
  },

  getGithubOAuthUrl(): string {
    return `${ENV.API_BASE_URL}${API_ENDPOINTS.AUTH.GITHUB_OAUTH}`;
  },
};
