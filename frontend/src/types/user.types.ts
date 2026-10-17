export type Gender = "male" | "female" | "other";

export type MembershipType = "silver" | "gold" | null;

export type OAuthProvider = "google" | "github" | null;

/**
 * Core Developer Profile domain entity.
 */
export interface UserProfile {
  _id: string;
  firstName: string;
  lastName?: string;
  emailId?: string;
  age?: number;
  gender?: Gender;
  photoUrl: string;
  about: string;
  skills: string[];
  isPremium?: boolean;
  membershipType?: MembershipType;
  oauthProvider?: OAuthProvider;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload allowed by `PATCH /profile/edit`.
 */
export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  age?: number;
  gender?: Gender;
  about?: string;
  skills?: string[];
}

/**
 * Payload for `PATCH /profile/password`.
 */
export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}
