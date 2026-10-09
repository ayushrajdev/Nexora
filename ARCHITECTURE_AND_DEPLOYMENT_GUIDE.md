# DevTinder Microservices: Complete Architecture, Execution, Testing & Deployment Guide

---

## 1. How Docker and Servers Work Together

### The Core Idea: "A Lightweight Mini-Computer for Every Service"
Without Docker, running 6 microservices means opening 6 terminal windows on your laptop, each running `npm start` on a different port (`3001`, `3002`, `3003`, etc.), plus manually installing and starting MongoDB and Redis on your machine. If your Node.js version changes or an OS library is missing, things break.

With **Docker**:
- Each microservice runs inside its own **container** (an isolated environment that contains its own Node.js runtime, dependencies, and code).
- Docker creates a private virtual network (called a **Bridge Network**) behind the scenes.
- Inside this network, services can talk to each other using their service names like web addresses:
  - `http://auth-service:3001`
  - `http://profile-service:3002`
  - `redis:6379`
  - `mongodb:27017`
- You don't need to expose ports 3001–3006 to your actual computer. Only **Port 3000 (API Gateway)** is exposed to your laptop (`localhost:3000`).

---

## 2. How the DevTinder Microservices Work Together

```
                      React Frontend (:5173) / Postman
                                     │
                                     │ (sid cookie / WebSocket)
                                     ▼
                ┌─────────────────────────────────────────┐
                │           API Gateway (:3000)           │
                │  • Only entry point                     │
                │  • Rate limiting & CORS                 │
                │  • Inspects 'sid' cookie in Redis       │
                │  • Injects X-User-* headers downstream  │
                └────────────────────┬────────────────────┘
                                     │
      ┌──────────────┬───────────────┼───────────────┬──────────────┐
      │ /auth        │ /profile      │ /request, /user│ /chat       │ /payment
      ▼              ▼               ▼               ▼              ▼
┌───────────┐  ┌───────────┐   ┌───────────┐   ┌───────────┐  ┌───────────┐
│   Auth    │  │  Profile  │   │ Matching  │   │   Chat    │  │  Payment  │
│  Service  │  │  Service  │   │  Service  │   │  Service  │  │  Service  │
│  (:3001)  │  │  (:3002)  │   │  (:3003)  │   │  (:3004)  │  │  (:3005)  │
└─────┬─────┘  └─────┬─────┘   └─────┬─────┘   └─────┬─────┘  └─────┬─────┘
      │              │               │               │              │
      │              ▲               ▲               │              │
      │              │(sync HTTP)    │(sync HTTP)    │              │
      │              └───────────────┼───────────────┘              │
      │                              │                              │
      │(async events)                │(async events)                │(async events)
      ▼                              ▼                              ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │                        Redis Event Bus (BullMQ)                     │
  └──────────────────────────────────┬──────────────────────────────────┘
                                     │
                                     ▼
                      ┌─────────────────────────────┐
                      │ Notification Service (:3006)│
                      │  • Sends AWS SES Emails     │
                      │  • Background Worker        │
                      └─────────────────────────────┘
```

### The Request Lifecycle:
1. **User Logs In**:
   - `POST http://localhost:3000/auth/login` → Gateway routes to `Auth Service`.
   - Auth Service validates password with bcrypt.
   - Auth Service saves active session in **Redis** and **MongoDB**.
   - Auth Service responds with `Set-Cookie: sid=uuid4; HttpOnly; SameSite=Lax`.
2. **Subsequent Authenticated Requests (e.g. View Profile or Feed)**:
   - Frontend calls `GET http://localhost:3000/profile/view` with cookie `sid`.
   - Gateway intercepts the request, looks up `sid` in Redis.
   - Gateway injects headers: `X-User-Id: 64f...`, `X-User-Email: ...`.
   - Profile Service reads `req.headers['x-user-id']` and returns user data.
3. **Async Operations (Sending an Interest)**:
   - User clicks "Interested" → `POST http://localhost:3000/request/send/interested/:toUserId`.
   - Matching Service verifies user exists (sync call to Profile Service).
   - Matching Service saves the connection request and drops an event `connection.interested` into **BullMQ** (via Redis).
   - Matching Service returns `200 OK` **immediately** (no waiting for emails).
   - `Notification Service` picks up the job from BullMQ in the background and sends an email via AWS SES.

---

## 3. How to Run the Project Locally

### Step 1: Prepare `.env`
Ensure you have a `.env` file in the root folder `DevTinder/`. If you haven't, copy `.env.example`:
```powershell
Copy-Item .env.example .env
```
*(Default values work out of the box for MongoDB and Redis inside Docker).*

### Step 2: Start All Services
In your terminal, inside `c:\Users\ayush\OneDrive\Desktop\DevTinder`:
```powershell
docker compose up
```
*To run in the background (detached mode):*
```powershell
docker compose up -d
```

### Step 3: Verify Everything Is Running
Open another terminal:
```powershell
docker compose ps
```
You will see 9 containers running healthy:
- `devtinder-api-gateway-1` on port `0.0.0.0:3000->3000`
- `devtinder-auth-service-1`
- `devtinder-profile-service-1`
- `devtinder-matching-service-1`
- `devtinder-chat-service-1`
- `devtinder-payment-service-1`
- `devtinder-notification-service-1`
- `devtinder-mongodb-1`
- `devtinder-redis-1`

### Step 4: Stop Containers
```powershell
docker compose down
```

---

## 4. Connecting the Frontend (React / Vite)

Your frontend connects **ONLY** to the API Gateway at port `3000`. It does not need to know that microservices exist behind it.

### Frontend API Configuration (Axios example)
```javascript
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true, // IMPORTANT: Allows cookies (sid) to be sent and received
});
```

### Real-Time Socket.IO in Frontend
```javascript
import { io } from "socket.io-client";

// Connect directly to Gateway URL
const socket = io("http://localhost:3000", {
  withCredentials: true, // Sends session cookie in handshake
});

// Join chat room
socket.emit("joinChat", { targetUserId: "6501a2b3c4..." });

// Send message
socket.emit("sendMessage", {
  targetUserId: "6501a2b3c4...",
  text: "Hey! What tech stack do you use?",
});

// Listen for incoming messages
socket.on("messageReceived", (data) => {
  console.log("New message:", data);
});
```

---

## 5. Testing the APIs with Postman

Since authentication is session-based via HTTP cookies:
1. In Postman, ensure **Cookies** are enabled (Postman enables this by default).
2. All endpoints use `http://localhost:3000` as the host.

### Test Sequence:

#### 1. Signup (`POST /auth/signup`)
- **URL**: `http://localhost:3000/auth/signup`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON)**:
  ```json
  {
    "firstName": "Ayush",
    "lastName": "Dev",
    "emailId": "ayush@example.com",
    "password": "Password@123"
  }
  ```
- **Response**: `200 OK` + `Set-Cookie: sid=...` header.

#### 2. View Profile (`GET /profile/view`)
- **URL**: `http://localhost:3000/profile/view`
- **Method**: `GET`
- **Result**: Postman automatically attaches the `sid` cookie. You will receive your user profile.

#### 3. Edit Profile (`PATCH /profile/edit`)
- **URL**: `http://localhost:3000/profile/edit`
- **Method**: `PATCH`
- **Body (raw JSON)**:
  ```json
  {
    "about": "Full stack engineer building microservices",
    "skills": ["Node.js", "Docker", "Redis", "MongoDB"]
  }
  ```

#### 4. Feed (`GET /user/feed`)
- **URL**: `http://localhost:3000/user/feed?page=1&limit=10`
- **Method**: `GET`

#### 5. Send Connection Request (`POST /request/send/:status/:toUserId`)
- **URL**: `http://localhost:3000/request/send/interested/TARGET_USER_ID`
- **Method**: `POST`

#### 6. Logout (`POST /auth/logout`)
- **URL**: `http://localhost:3000/auth/logout`
- **Method**: `POST`
- **Result**: Destroys session in Redis & MongoDB, clears `sid` cookie.

---

## 6. Deployment in Production (Render vs AWS)

### Option A: PaaS (Render / Railway) — Beginner-Friendly

On Render or Railway, you create separate Web Services for each component:

1. **Databases**:
   - Create a **Managed Redis** instance on Render or Upstash.
   - Create a **Managed MongoDB Atlas** cluster.
2. **Deploy Each Service**:
   - Create a new **Web Service** on Render from your Git repository for each microservice:
     - Root directory: `./`
     - Dockerfile path: `./services/auth-service/Dockerfile`
     - Environment Variables: Provide `REDIS_HOST`, `DB_CONNECTION_STRING`, etc.
   - Make services 3001–3006 **Private Services** (no public URLs).
3. **Deploy the Gateway**:
   - Deploy `api-gateway` as a **Public Web Service** (accessible at `https://api.devtinder.com`).
   - Give the gateway the internal service URLs provided by Render (e.g. `http://auth-service.onrender.internal:3001`).
4. **Deploy the Frontend**:
   - Deploy React/Vite on Vercel, Netlify, or Render Static Sites.
   - Set frontend API base URL to `https://api.devtinder.com`.

---

### Option B: AWS ECS (Elastic Container Service) with Fargate — Production Standard

```
              Internet Users / Mobile App
                          │
                          ▼
        [ Application Load Balancer (ALB) ]
            (https://api.devtinder.com)
                          │
                          ▼
            [ API Gateway ECS Container ]
                          │
       ┌───────────┬──────┴────┬───────────┐
       ▼           ▼           ▼           ▼
   [ Auth ]   [ Profile ]  [ Match ]   [ Chat ]
      Task       Task        Task        Task
       │           │           │           │
       └─────┬─────┴───────────┴───────────┘
             │
             ├──► [ Amazon ElastiCache (Redis) ]
             ├──► [ MongoDB Atlas (VPC Peering) ]
             └──► [ BullMQ Queue ] ──► [ Notification Task ] ──► Amazon SES
```

### Step-by-Step AWS Deployment:
1. **Container Registry (Amazon ECR)**:
   - Push each Docker image to its own ECR repository:
     ```bash
     docker tag devtinder-api-gateway:latest <account_id>.dkr.ecr.us-east-1.amazonaws.com/devtinder-api-gateway:latest
     docker push <account_id>.dkr.ecr.us-east-1.amazonaws.com/devtinder-api-gateway:latest
     ```
2. **AWS Fargate Tasks**:
   - Define an ECS Task Definition for each service specifying memory, CPU, and ECR image URI.
   - Services run in private subnets with auto-scaling rules (e.g., scale chat service if CPU > 70%).
3. **Application Load Balancer (ALB)**:
   - ALB handles SSL/TLS termination (`https://api.devtinder.com`) and routes incoming traffic to the `api-gateway` task.
4. **Managed Data Stores**:
   - **Amazon ElastiCache (Redis)** for sessions and BullMQ queues.
   - **MongoDB Atlas** for document databases.
5. **AWS SES**:
   - Production IAM role attached to the `notification-service` ECS task allows sending emails without exposing API secret keys in environment variables.

---

## 7. How Services Behave Under Load & Failures

| Scenario | Monolithic Behavior | Microservices Behavior |
| :--- | :--- | :--- |
| **Spike in Chat / Socket.IO traffic** | Chat consumes Node event loop; entire app (logins, profiles) slows down or crashes. | Only `chat-service` containers scale up or experience load. Auth, matching, and payment continue running smoothly. |
| **Email service / AWS SES is slow or down** | Signup or "interested" request hangs for seconds waiting for email delivery. | Requests return instantly (milliseconds). BullMQ holds jobs in Redis and retries automatically with exponential backoff. |
| **New feature deployment (e.g. Updating Payment)** | Entire monolith must be redeployed with brief downtime. | Only the `payment-service` container is rebuilt and replaced via rolling update. No other service is touched. |
