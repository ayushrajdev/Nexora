# DevTinder — Microservices Architecture & Implementation Guide

This project is fully decomposed into a clean, scalable microservices architecture adhering to layered design principles (**Controller → Service → Repository**), dual session storage (Redis + MongoDB), OAuth integration (Google & GitHub), BullMQ event-driven asynchronous communication, and synchronous REST client integration.

---

## 1. System Architecture Overview

```
                      +-----------------------------+
                      |   Client Application        |
                      |   (React / Vite @ :5173)     |
                      +--------------+--------------+
                                     |
                                     | (sid cookie / WebSocket)
                                     v
                      +-----------------------------+
                      |   API Gateway (:3000)       |
                      |   - Route-based reverse proxy|
                      |   - Global Rate Limiting     |
                      |   - CORS handling            |
                      |   - Session Auth & Headers   |
                      +--------------+--------------+
                                     |
     +---------------+---------------+---------------+---------------+
     | (REST/HTTP)   | (REST/HTTP)   | (REST/HTTP)   | (REST/HTTP)   | (REST/WS)
     v               v               v               v               v
+----------+   +----------+   +----------+   +----------+   +----------+
|  Auth    |   | Profile  |   | Matching |   | Payment  |   |   Chat   |
| Service  |   | Service  |   | Service  |   | Service  |   | Service  |
|  (:3001) |   |  (:3002) |   |  (:3003) |   |  (:3005) |   |  (:3004) |
+----+-----+   +----+-----+   +----+-----+   +----+-----+   +----+-----+
     |              |              |              |              |
     |              |              +-------+      |              |
     |              |                      |      |              |
     |              | (Async events via BullMQ)   |              |
     |              v                      v      v              |
     |        +----------------------------------------+         |
     |        |      Notification Service (:3006)      |         |
     |        |   - Consumes BullMQ events             |         |
     |        |   - AWS SES Emails (Welcome, Matches)  |         |
     |        +----------------------------------------+         |
     |                                                           |
     +-----------------------------+-----------------------------+
                                   |
             +---------------------+---------------------+
             |                                           |
             v                                           v
   +--------------------+                      +--------------------+
   |    Redis (:6379)   |                      |  MongoDB (:27017)  |
   | - Active Sessions  |                      | - Auth / Sessions  |
   | - BullMQ Event Bus |                      | - ConnectionReqs   |
   +--------------------+                      | - Chats            |
                                               | - Payments         |
                                               +--------------------+
```

---

## 2. Directory Layout & Services

```
DevTinder/
├── api-gateway/               # Reverse proxy, rate limiting, and session verification
├── services/
│   ├── auth-service/          # Signup/Login, Google/GitHub OAuth, Session store
│   ├── profile-service/       # View/edit profile, password reset, feed candidates
│   ├── matching-service/      # Connection requests, matching logic, user feed
│   ├── chat-service/          # 1-on-1 chats, Socket.IO rooms & real-time messaging
│   ├── payment-service/       # Razorpay subscriptions, orders, webhooks
│   └── notification-service/  # Async event consumer, AWS SES email worker, daily cron
├── shared/                    # Shared library (@devtinder/shared)
│   ├── src/
│   │   ├── authMiddleware.js  # Downstream service authentication middleware
│   │   ├── constants.js       # Global queues, events, status enums
│   │   ├── errorHandler.js    # Standardized error responder
│   │   ├── errors.js          # AppError hierarchy
│   │   ├── httpClient.js      # Inter-service axios client
│   │   ├── logger.js          # Winston logger
│   │   ├── messageQueue.js    # BullMQ producer / consumer helpers
│   │   ├── redis.js           # Singleton Redis client
│   │   ├── responseFormatter.js
│   │   └── sessionManager.js  # Redis session lifecycle helper
├── docker-compose.yml         # Full container orchestration configuration
└── .env.example               # Environment variables template
```

---

## 3. Core Design Principles & Scalable Patterns

1. **Layered Architecture (Controller → Service → Repository)**:
   - **Controllers**: Responsible strictly for receiving HTTP payloads, invoking service methods, and sending uniform JSON responses.
   - **Services**: Contain pure business rules, trigger inter-service sync calls, and publish domain events.
   - **Repositories**: Encapsulate Mongoose queries and data-access isolation.
2. **Dual-Layer Session Storage**:
   - **Redis Cache**: Low-latency session retrieval on every incoming gateway request and Socket.IO handshake. Supports instant revocation and TTL auto-expiry.
   - **MongoDB Persistence**: Stores sessions with device metadata (IP, user-agent) and provides auditing/active session tracking capabilities.
3. **Session-Based Authentication via API Gateway**:
   - Client sends HTTP cookie `sid`.
   - Gateway verifies session from Redis, injects verified `X-User-Id`, `X-User-Email`, `X-User-Name`, `X-User-Premium` headers downstream.
   - Downstream services remain stateless and read identity via `internalAuth` middleware.
4. **OAuth 2.0 (Google & GitHub)**:
   - Auth Service handles OAuth callback code exchange, fetches user details, links or provisions user records, establishes sessions in Redis & MongoDB, and sets the secure `sid` cookie.
5. **Event-Driven Asynchronous Communication (BullMQ + Redis)**:
   - Used for non-blocking operations:
     - `user.created` → Triggers welcome email.
     - `connection.interested` → Sends notification email to recipient.
     - `connection.accepted` → Sends match notification.
     - `payment.captured` → Triggers premium entitlement update and payment receipt.
6. **Synchronous REST Communication (Inter-Service Client)**:
   - Used when immediate consistency is required:
     - Matching Service queries Profile Service for user details and feed exclusion.
     - Chat Service queries Matching Service to verify an accepted connection prior to initiating chat.

---

## 4. Running the Project

### Using Docker Compose (Recommended)
```bash
# 1. Configure environment variables
cp .env.example .env

# 2. Build and run all services + MongoDB + Redis
docker-compose up --build
```

### Running Locally (Without Docker)
1. Ensure **Redis** (`localhost:6379`) and **MongoDB** (`localhost:27017`) are running.
2. Install shared package dependencies:
   ```bash
   cd shared && npm install
   ```
3. In each service directory (`api-gateway`, `services/auth-service`, `services/profile-service`, etc.):
   ```bash
   npm install
   npm start
   ```



