import { UserProfile } from "./user.types";

export type SwipeStatus = "interested" | "ignored";

export type ReviewStatus = "accepted" | "rejected";

export type ConnectionRequestStatus = SwipeStatus | ReviewStatus;

export interface ConnectionRequest {
  _id: string;
  fromUserId: string;
  toUserId: string;
  status: ConnectionRequestStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Shape returned by `GET /user/requests/received`
 */
export interface ReceivedConnectionRequest extends ConnectionRequest {
  fromUser: UserProfile;
}

/**
 * Shape returned by `GET /user/connections`
 */
export interface ConnectionItem extends ConnectionRequest {
  user: UserProfile;
}
