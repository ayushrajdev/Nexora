import { UserProfile } from "./user.types";

export interface LoginCredentials {
  emailId: string;
  password: string;
}

export interface SignupPayload {
  firstName: string;
  lastName?: string;
  emailId: string;
  password: string;
  age?: number;
  gender?: "male" | "female" | "other";
  photoUrl?: string;
  about?: string;
  skills?: string[];
}

export interface AuthResponseData {
  user: UserProfile;
}
