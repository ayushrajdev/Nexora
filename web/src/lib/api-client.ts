import axios, { AxiosError, AxiosInstance } from "axios";
import { ENV } from "@/config/env";
import { ApiError } from "@/types";

/**
 * Central Axios HTTP client configured to communicate exclusively with
 * the DevTinder API Gateway (:3000) and persist the HTTP-only `sid` cookie.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

/**
 * Normalizes any unknown or Axios error into a structured `ApiError`.
 */
export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{
      message?: string;
      error?: string;
    }>;
    const serverMessage =
      axiosErr.response?.data?.message ||
      axiosErr.response?.data?.error ||
      axiosErr.message ||
      "An unexpected network error occurred";

    return {
      message:
        typeof serverMessage === "string"
          ? serverMessage
          : "Request failed. Please try again.",
      statusCode: axiosErr.response?.status,
      code: axiosErr.code,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "An unexpected error occurred" };
}
