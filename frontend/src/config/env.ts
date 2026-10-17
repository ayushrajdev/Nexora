/**
 * Centralized environment & runtime configuration.
 * All requests go exclusively through the API Gateway on port 3000.
 */
export const ENV = {
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
  SOCKET_URL:
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:3000",
} as const;

export const APP_CONFIG = {
  NAME: "DevTinder",
  TAGLINE: "Where Developers Connect, Collaborate & Ship Together",
  DEFAULT_AVATAR: "https://geographyandyou.com/images/user-profile.png",
  MAX_SKILLS: 10,
  DEFAULT_FEED_LIMIT: 15,
} as const;
