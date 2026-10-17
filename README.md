# DevTinder — Microservices Architecture & Complete Frontend Integration Guide

DevTinder is an event-driven, production-grade microservices platform decomposed using layered architecture (**Controller → Service → Repository**), dual-layer session storage (Redis + MongoDB), BullMQ asynchronous event queues, and real-time Socket.IO messaging.

---

## Table of Contents
1. [System Architecture & Network Security](#1-system-architecture--network-security)
2. [Service Catalog & Port Allocation](#2-service-catalog--port-allocation)
3. [Running & Controlling the Services](#3-running--controlling-the-services)
4. [Frontend Setup & Connection Guide](#4-frontend-setup--connection-guide)
   - [Axios HTTP Client](#a-axios-http-client)
   - [Socket.IO Real-Time Client](#b-socketio-real-time-client)
5. [Complete API Reference](#5-complete-api-reference)
   - [1. Authentication Service (`/auth/*`)](#1-authentication-service-auth)
   - [2. Profile Service (`/profile/*`)](#2-profile-service-profile)
   - [3. Feed & Matching Service (`/user/*` and `/request/*`)](#3-feed--matching-service-user-and-request)
   - [4. Real-Time Chat Service (`/chat/*` & WebSocket)](#4-real-time-chat-service-chat--websocket)
   - [5. Payment Service (`/payment/*`)](#5-payment-service-payment)
6. [Asynchronous Event Flow (BullMQ & Notification Service)](#6-asynchronous-event-flow-bullmq--notification-service)
7. [Frontend Redux / App Flow Guide](#7-frontend-redux--app-flow-guide)

---

## 1. System Architecture & Network Security

Only the **API Gateway** port (`3000`) is exposed to the host machine / frontend. All downstream microservices, MongoDB, and Redis reside within Docker's isolated internal bridge network (`devtinder-network`).

```
                              [ React / Vite Frontend (:5173) ]
                                              │
                                              │ HTTP (withCredentials: true)
                                              │ WebSocket (Socket.IO)
                                              ▼
                               ┌─────────────────────────────┐
                               │     API Gateway (:3000)     │  <--- ONLY PUBLIC PORT
                               │   • Central CORS & Limiter  │
                               │   • Intercepts 'sid' cookie │
                               │   • Validates with Redis    │
                               │   • Injects X-User-* headers│
                               └──────────────┬──────────────┘
                                              │ (Internal Virtual Docker Network)
                 ┌────────────────────────────┼────────────────────────────┐
                 │                            │                            │
                 ▼                            ▼                            ▼
      ┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
      │    Auth Service     │      │   Profile Service   │      │  Matching Service   │
      │       (:3001)       │      │       (:3002)       │      │       (:3003)       │
      └──────────┬──────────┘      └──────────┬──────────┘      └──────────┬──────────┘
                 │                            │                            │
                 ▼                            ▼                            ▼
      ┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
      │    Chat Service     │      │   Payment Service   │      │Notification Service │
      │   (:3004 / WS)      │      │       (:3005)       │      │   (:3006 / Worker)  │
      └──────────┬──────────┘      └──────────┬──────────┘      └──────────┬──────────┘
                 │                            │                            │
                 └────────────────────────────┼────────────────────────────┘
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │               Shared Datastores              │
                       │  • Redis (:6379) - Sessions & BullMQ Bus     │
                       │  • MongoDB (:27017) - Document Databases     │
                       └──────────────────────────────────────────────┘
```

### Security & Authentication Pattern
1. **HTTP-only Cookie (`sid`)**: On signup or login, the client receives an HTTP-only cookie named `sid`.
2. **Reverse-Proxy Verification**: When the frontend requests an authenticated resource, the API Gateway intercepts `sid`, verifies the session token against Redis (`session:<sid>`), refreshes its TTL (24h default), and injects verified identity headers:
   - `X-User-Id`
   - `X-User-Email`
   - `X-User-Name`
   - `X-User-Premium`
   - `X-User-Membership`
3. **Internal Microservices**: Never parse raw passwords or tokens. They validate the internal proxy signature and read user state directly from request headers.

---

## 2. Service Catalog & Port Allocation

| Service | Internal Port | Public Host Port | Responsibilities |
|---|---|---|---|
| **api-gateway** | `3000` | `3000` | Route proxying, rate limiting, session auth validation, header sanitization |
| **auth-service** | `3001` | *Hidden* | Signup, login, logout, OAuth (Google & GitHub), Redis/Mongo dual session store |
| **profile-service** | `3002` | *Hidden* | Profile view, profile edit, password updates, candidate query for feed |
| **matching-service** | `3003` | *Hidden* | Swipe logic (`interested`/`ignored`), connection requests, friend matching, discovery feed |
| **chat-service** | `3004` | *Hidden* | 1-on-1 chat history retrieval, Socket.IO real-time rooms & instant messaging |
| **payment-service** | `3005` | *Hidden* | Razorpay order generation, subscription verification, webhook handling |
| **notification-service** | `3006` | *Hidden* | BullMQ worker, AWS SES transactional emails (welcome, interest, match, payment) |
| **redis** | `6379` | `6379` | High-speed cache for active sessions and BullMQ message broker |
| **mongodb** (Host) | `27017` | `27017` | Local system MongoDB (`mongodb://localhost:27017/devtinder_auth`, no auth) |

---

## 3. Running & Controlling the Services

All microservices and Redis are orchestrated via Docker Compose, connecting to your host's local MongoDB:

```bash
# Start all containers in background
docker compose up -d

# Verify all containers are up and healthy
docker compose ps

# View live aggregate logs
docker compose logs -f

# View logs for a specific service (e.g. auth-service or api-gateway)
docker compose logs -f auth-service
docker compose logs -f api-gateway

# Rebuild containers after modifying backend code
docker compose up -d --build

# Stop and shut down all containers
docker compose down
```

---

## 4. Frontend Setup & Connection Guide

### A. Axios HTTP Client
Always configure Axios with `withCredentials: true` so the browser automatically sends and persists the `sid` session cookie across cross-origin requests.

Create `src/utils/api.js`:
```javascript
import axios from "axios";

export const BASE_URL = "http://localhost:3000";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // MANDATORY: Sends and stores the 'sid' session cookie
  headers: {
    "Content-Type": "application/json",
  },
});
```

### B. Socket.IO Real-Time Client
Real-time chat connects directly through the API Gateway on port `3000`. Socket.IO will automatically forward handshake cookies for authentication.

Create `src/utils/socket.js`:
```javascript
import { io } from "socket.io-client";
import { BASE_URL } from "./api";

export const createSocketConnection = () => {
  return io(BASE_URL, {
    withCredentials: true, // Passes the 'sid' cookie during the WebSocket handshake
    transports: ["websocket", "polling"],
  });
};
```

---

## 5. Complete API Reference

All requests must be targeted to `http://localhost:3000`.

### 1. Authentication Service (`/auth/*`)

#### A. Sign Up
- **Method:** `POST`
- **Path:** `/auth/signup`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "firstName": "Elon",
    "lastName": "Musk",
    "emailId": "elon@x.com",
    "password": "Password@123"
  }
  ```
- **Response (201 Created):**
  Sets HTTP-only cookie: `sid=<sessionId>`
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "_id": "67064d7c0...",
        "firstName": "Elon",
        "lastName": "Musk",
        "emailId": "elon@x.com",
        "photoUrl": "https://geographyandyou.com/images/user-profile.png",
        "about": "This is a default about of the user!",
        "skills": [],
        "isPremium": false
      }
    }
  }
  ```

#### B. Log In
- **Method:** `POST`
- **Path:** `/auth/login`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "emailId": "elon@x.com",
    "password": "Password@123"
  }
  ```
- **Response (200 OK):**
  Sets HTTP-only cookie: `sid=<sessionId>`
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "_id": "67064d7c0...",
        "firstName": "Elon",
        "lastName": "Musk",
        "emailId": "elon@x.com",
        "photoUrl": "https://geographyandyou.com/images/user-profile.png",
        "about": "This is a default about of the user!",
        "skills": [],
        "isPremium": false
      }
    }
  }
  ```

#### C. Log Out
- **Method:** `POST`
- **Path:** `/auth/logout`
- **Auth Required:** Yes
- **Response (200 OK):**
  Clears `sid` cookie and destroys session in Redis & MongoDB.
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

#### D. OAuth 2.0 (Google & GitHub)
- **Initiate Google Login:** Direct browser navigation or `window.location.href = "http://localhost:3000/auth/oauth/google"`
- **Initiate GitHub Login:** Direct browser navigation or `window.location.href = "http://localhost:3000/auth/oauth/github"`
- *After user consent, the backend exchanges the code, creates the user & session, sets the `sid` cookie, and redirects the browser back to `FRONT_END_URL`.*

---

### 2. Profile Service (`/profile/*`)

#### A. View Profile
- **Method:** `GET`
- **Path:** `/profile/view`
- **Auth Required:** Yes
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "67064d7c0...",
      "firstName": "Elon",
      "lastName": "Musk",
      "emailId": "elon@x.com",
      "age": 52,
      "gender": "male",
      "photoUrl": "https://pbs.twimg.com/profile_images/...",
      "about": "Technoking of Tesla, Chief Engineer at SpaceX",
      "skills": ["Python", "Rust", "C++", "Rocket Science"],
      "isPremium": false,
      "membershipType": null
    }
  }
  ```

#### B. Edit Profile
- **Method:** `PATCH`
- **Path:** `/profile/edit`
- **Auth Required:** Yes
- **Allowed Fields:** `firstName`, `lastName`, `photoUrl`, `age`, `gender`, `about`, `skills` (max 10 items)
- **Request Body:**
  ```json
  {
    "about": "Coding AI agents and space rockets",
    "skills": ["TypeScript", "Node.js", "Docker", "Kubernetes"],
    "age": 53
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "data": { ...updatedUserObject }
  }
  ```

#### C. Change Password
- **Method:** `PATCH`
- **Path:** `/profile/password`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "oldPassword": "Password@123",
    "newPassword": "NewStrongPassword@2026"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

---

### 3. Feed & Matching Service (`/user/*` and `/request/*`)

#### A. Discovery Feed
Retrieves candidate cards excluding the current user, previously swiped profiles, and existing connections.
- **Method:** `GET`
- **Path:** `/user/feed?page=1&limit=10`
- **Auth Required:** Yes
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "67064f2a0...",
        "firstName": "Satya",
        "lastName": "Nadella",
        "age": 56,
        "gender": "male",
        "photoUrl": "https://...",
        "about": "Empowering every person and organization on the planet",
        "skills": ["Cloud", "AI", "Leadership"]
      }
    ]
  }
  ```

#### B. Send Connection Request (Swipe Action)
- **Method:** `POST`
- **Path:** `/request/send/:status/:toUserId`
- **Auth Required:** Yes
- **URL Parameters:**
  - `:status` — Either `interested` (Swipe Right) or `ignored` (Swipe Left)
  - `:toUserId` — MongoDB `_id` of the target user
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Connection request sent successfully",
    "data": {
      "_id": "6706509b0...",
      "fromUserId": "67064d7c0...",
      "toUserId": "67064f2a0...",
      "status": "interested"
    }
  }
  ```

#### C. Review Received Request (Accept / Reject)
- **Method:** `POST`
- **Path:** `/request/review/:status/:requestId`
- **Auth Required:** Yes
- **URL Parameters:**
  - `:status` — Either `accepted` or `rejected`
  - `:requestId` — MongoDB `_id` of the ConnectionRequest document
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Connection request accepted",
    "data": {
      "_id": "6706509b0...",
      "status": "accepted"
    }
  }
  ```

#### D. List Received Requests
Shows all profiles who have sent an `interested` request to the logged-in user.
- **Method:** `GET`
- **Path:** `/user/requests/received`
- **Auth Required:** Yes
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "6706509b0...",
        "status": "interested",
        "fromUser": {
          "_id": "67064f2a0...",
          "firstName": "Satya",
          "lastName": "Nadella",
          "photoUrl": "https://...",
          "about": "Empowering every person...",
          "skills": ["Cloud", "AI"]
        }
      }
    ]
  }
  ```

#### E. List Active Connections (Matches)
Shows all matched connections with mutual acceptance.
- **Method:** `GET`
- **Path:** `/user/connections`
- **Auth Required:** Yes
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "6706509b0...",
        "user": {
          "_id": "67064f2a0...",
          "firstName": "Satya",
          "lastName": "Nadella",
          "photoUrl": "https://...",
          "about": "Empowering every person...",
          "skills": ["Cloud", "AI"]
        }
      }
    ]
  }
  ```

---

### 4. Real-Time Chat Service (`/chat/*` & WebSocket)

#### A. Fetch Chat History
Fetches or creates a chat session between two connected users.
- **Method:** `GET`
- **Path:** `/chat/:targetUserId`
- **Auth Required:** Yes
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "67065a880...",
      "participants": ["67064d7c0...", "67064f2a0..."],
      "messages": [
        {
          "_id": "67065b110...",
          "senderId": "67064f2a0...",
          "text": "Hey Elon! Loved the new rocket demo.",
          "createdAt": "2026-10-17T09:30:00.000Z"
        }
      ]
    }
  }
  ```

#### B. Socket.IO Real-Time Messaging Contract

1. **Connect:**
   ```javascript
   const socket = io("http://localhost:3000", { withCredentials: true });
   ```

2. **Join Chat Room:**
   Send this event as soon as the user opens a chat view with a contact.
   ```javascript
   socket.emit("joinChat", { targetUserId: "67064f2a0..." });
   ```

3. **Send Message:**
   ```javascript
   socket.emit("sendMessage", {
     targetUserId: "67064f2a0...",
     text: "Thanks Satya! Azure is looking great too."
   });
   ```

4. **Receive Message Listener:**
   ```javascript
   socket.on("messageReceived", ({ senderId, firstName, text, createdAt }) => {
     console.log(`New message from ${firstName}: ${text}`);
     // Append to current chat state
   });
   ```

---

### 5. Payment Service (`/payment/*`)

#### A. Create Razorpay Order
- **Method:** `POST`
- **Path:** `/payment/create`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "membershipType": "silver" // or "gold"
  }
  ```
  *(Silver: ₹300, Gold: ₹700)*
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "orderId": "order_P1982736152",
      "amount": 30000,
      "currency": "INR",
      "keyId": "rzp_test_1DP5mmOlF5G5ag",
      "notes": {
        "firstName": "Elon",
        "lastName": "Musk",
        "membershipType": "silver"
      }
    }
  }
  ```

#### B. Frontend Razorpay Checkout Handler
```javascript
const handlePayment = async (membershipType) => {
  const { data } = await api.post("/payment/create", { membershipType });
  const { orderId, amount, currency, keyId, notes } = data.data;

  const options = {
    key: keyId,
    amount,
    currency,
    name: "DevTinder",
    description: `Upgrade to ${membershipType.toUpperCase()}`,
    order_id: orderId,
    prefill: {
      name: `${notes.firstName} ${notes.lastName}`,
    },
    theme: {
      color: "#e11d48",
    },
    handler: async function (response) {
      // Payment captured on Razorpay; webhook updates backend asynchronously
      alert("Payment successful! Membership updated.");
      window.location.reload();
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};
```

#### C. Verify Premium Status
- **Method:** `GET`
- **Path:** `/payment/premium/verify`
- **Auth Required:** Yes
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "isPremium": true,
      "membershipType": "silver"
    }
  }
  ```

---

## 6. Asynchronous Event Flow (BullMQ & Notification Service)

DevTinder microservices publish and consume domain events over BullMQ and Redis:

```
[Matching Service] ───(connection.interested)───► [Redis / BullMQ] ───► [Notification Service] ───► AWS SES Email
[Matching Service] ───(connection.accepted)────► [Redis / BullMQ] ───► [Notification Service] ───► AWS SES Email
[Auth Service]     ───(user.created)───────────► [Redis / BullMQ] ───► [Notification Service] ───► Welcome Email
[Payment Service]  ───(payment.captured)───────► [Redis / BullMQ] ───┬─► [Notification Service] ───► Receipt Email
                                                                     └─► [Auth Service]         ───► Set isPremium=true
```

---

## 7. Frontend Redux / App Flow Guide

### 1. App Startup (`App.jsx`)
```javascript
useEffect(() => {
  const checkAuth = async () => {
    try {
      const res = await api.get("/profile/view");
      dispatch(addUser(res.data.data)); // Authenticated
    } catch (err) {
      dispatch(removeUser()); // Redirect to /login
    }
  };
  checkAuth();
}, []);
```

### 2. Login / Signup Flow
- Submit form to `POST /auth/login` or `POST /auth/signup`.
- Save returned user data into Redux store `userSlice`.
- Navigate user to `/feed`.

### 3. Swiping Discovery Feed Flow
- Dispatch `api.get("/user/feed")` to load profile cards.
- When the user swipes right: `api.post("/request/send/interested/" + user._id)`.
- When the user swipes left: `api.post("/request/send/ignored/" + user._id)`.
- Remove the top card from the Redux feed stack.

### 4. Real-Time Chat View Flow
- Call `api.get("/chat/" + targetUserId)` to populate existing message history.
- Initialize `socket = createSocketConnection()`.
- Emit `joinChat` with `{ targetUserId }`.
- Listen on `messageReceived` to append incoming messages live.
- On unmount: `socket.disconnect()`.
