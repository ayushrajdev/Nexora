import { MembershipPlan } from "@/types";

export const APP_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FEED: "/feed",
  CONNECTIONS: "/connections",
  REQUESTS: "/requests",
  CHAT: "/chat",
  CHAT_ROOM: (targetUserId: string) => `/chat/${targetUserId}`,
  PROFILE: "/profile",
  PREMIUM: "/premium",
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: "/auth/signup",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    GOOGLE_OAUTH: "/auth/oauth/google",
    GITHUB_OAUTH: "/auth/oauth/github",
  },
  PROFILE: {
    VIEW: "/profile/view",
    EDIT: "/profile/edit",
    PASSWORD: "/profile/password",
  },
  MATCHING: {
    FEED: "/user/feed",
    SEND_REQUEST: (status: string, toUserId: string) =>
      `/request/send/${status}/${toUserId}`,
    REVIEW_REQUEST: (status: string, requestId: string) =>
      `/request/review/${status}/${requestId}`,
    RECEIVED_REQUESTS: "/user/requests/received",
    CONNECTIONS: "/user/connections",
  },
  CHAT: {
    HISTORY: (targetUserId: string) => `/chat/${targetUserId}`,
  },
  PAYMENT: {
    CREATE_ORDER: "/payment/create",
    VERIFY_PREMIUM: "/payment/premium/verify",
  },
} as const;

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "silver",
    name: "Silver Developer",
    priceInr: 300,
    tagline: "Essential boost for active builders looking for collaborators.",
    badgeColor: "from-slate-300 to-slate-500",
    features: [
      "100 connection swipes per day",
      "Direct real-time chat with matched devs",
      "Silver verified badge on your developer card",
      "Priority placement in regional discovery feeds",
    ],
  },
  {
    id: "gold",
    name: "Gold Technoking",
    priceInr: 700,
    tagline: "Maximum visibility & unlimited networking for serious founders.",
    badgeColor: "from-amber-400 via-yellow-500 to-orange-500",
    popular: true,
    features: [
      "Unlimited connection swipes every day",
      "Gold verified badge & highlighted profile border",
      "Top-of-stack priority in discovery feed",
      "Instant real-time chat & code snippet sharing",
      "Early access to hackathon & co-founder matching filters",
    ],
  },
];

export const POPULAR_DEV_SKILLS = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Go",
  "Rust",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "AWS",
  "System Design",
  "Tailwind CSS",
  "PyTorch",
];
