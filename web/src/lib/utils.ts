import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { APP_CONFIG } from "@/config/env";

/**
 * Merges Tailwind CSS classes safely without style conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a full name from firstName and optional lastName.
 */
export function formatFullName(firstName?: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(" ") || "Developer";
}

/**
 * Generates 1-2 character uppercase initials for avatar fallbacks.
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.trim()?.[0] || "D";
  const last = lastName?.trim()?.[0] || "";
  return `${first}${last}`.toUpperCase();
}

/**
 * Ensures a valid photo URL or falls back to the default avatar.
 */
export function getSafeAvatarUrl(photoUrl?: string): string {
  if (!photoUrl || photoUrl.trim().length === 0) {
    return APP_CONFIG.DEFAULT_AVATAR;
  }
  return photoUrl;
}

/**
 * Formats an ISO timestamp into a concise human-readable time (e.g., "10:42 AM").
 */
export function formatMessageTime(isoDate?: string): string {
  if (!isoDate) return "";
  try {
    const date = new Date(isoDate);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
