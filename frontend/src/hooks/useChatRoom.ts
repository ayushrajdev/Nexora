"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { chatService } from "@/services/chat.service";
import { createSocketConnection } from "@/lib/socket-client";
import { normalizeApiError } from "@/lib/api-client";
import { ChatMessage, MessageReceivedEventPayload } from "@/types";

export function useChatRoom(targetUserId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // 1. Load initial chat history via HTTP
  useEffect(() => {
    if (!targetUserId) return;

    let isMounted = true;
    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        setError(null);
        const session = await chatService.getChatHistory(targetUserId);
        if (isMounted) {
          setMessages(session.messages ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setError(normalizeApiError(err).message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [targetUserId]);

  // 2. Establish Socket.IO connection & subscribe to room events
  useEffect(() => {
    if (!targetUserId) return;

    const socket = createSocketConnection();
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("joinChat", { targetUserId });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleMessageReceived = (payload: MessageReceivedEventPayload) => {
      setMessages((prev) => [
        ...prev,
        {
          _id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          senderId: payload.senderId,
          firstName: payload.firstName,
          text: payload.text,
          createdAt: payload.createdAt || new Date().toISOString(),
        },
      ]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("messageReceived", handleMessageReceived);

    // If socket connects synchronously
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("messageReceived", handleMessageReceived);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [targetUserId]);

  const sendMessage = useCallback(
    (text: string): boolean => {
      const trimmed = text.trim();
      if (!trimmed || !targetUserId || !socketRef.current) {
        return false;
      }

      socketRef.current.emit("sendMessage", {
        targetUserId,
        text: trimmed,
      });
      return true;
    },
    [targetUserId]
  );

  return {
    messages,
    isLoadingHistory,
    isConnected,
    error,
    sendMessage,
  };
}
