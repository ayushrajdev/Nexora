import { io, Socket } from "socket.io-client";
import { ENV } from "@/config/env";

/**
 * Creates a configured Socket.IO client connection through the API Gateway (:3000).
 * Automatically forwards the HTTP-only `sid` session cookie during the WebSocket handshake.
 */
export function createSocketConnection(): Socket {
  return io(ENV.SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}
