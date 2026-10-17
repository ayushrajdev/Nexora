"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  Wifi,
  WifiOff,
  Loader2,
  Terminal,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { UserProfile } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useChatRoom } from "@/hooks/useChatRoom";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { APP_ROUTES } from "@/config/routes";
import { cn, formatFullName, formatMessageTime } from "@/lib/utils";

interface ChatWindowProps {
  targetUserId: string;
  targetUser?: UserProfile | null;
}

const STARTER_PROMPTS = [
  "Hey! What side project are you hacking on right now?",
  "Loved your tech stack! Down to pair program sometime?",
  "Are you looking for a hackathon teammate or co-founder?",
];

export function ChatWindow({ targetUserId, targetUser }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, isLoadingHistory, isConnected, error, sendMessage } =
    useChatRoom(targetUserId);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const sent = sendMessage(inputText);
    if (sent) {
      setInputText("");
    }
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-900/75 shadow-2xl">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <Link
            href={APP_ROUTES.CHAT}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Avatar
            src={targetUser?.photoUrl}
            firstName={targetUser?.firstName || "Dev"}
            lastName={targetUser?.lastName}
            size="md"
            isPremium={targetUser?.isPremium}
          />
          <div>
            <h2 className="text-sm font-bold text-white">
              {targetUser
                ? formatFullName(targetUser.firstName, targetUser.lastName)
                : "Developer Chat"}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px]">
              {isConnected ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Socket.IO Connected
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> Connecting real-time channel...
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {isLoadingHistory ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
            <span>Loading encrypted chat history...</span>
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6">
            <p className="text-sm text-rose-400 font-medium">{error}</p>
            <p className="text-xs text-slate-400 mt-1">
              Make sure you are mutually connected with this developer.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-400">
              <Terminal className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Break the ice!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pick a conversation starter below or type your own message.
              </p>
            </div>
            <div className="w-full space-y-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInputText(prompt)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2.5 text-left text-xs text-slate-300 hover:border-brand-500/50 hover:text-white transition-colors"
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user?._id;
            return (
              <div
                key={msg._id || idx}
                className={cn(
                  "flex flex-col max-w-[78%] sm:max-w-[68%]",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                    isMe
                      ? "bg-gradient-to-r from-brand-600 to-rose-500 text-white rounded-br-xs"
                      : "bg-slate-800/95 text-slate-100 border border-slate-700/70 rounded-bl-xs"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
                <span className="mt-1 px-1 text-[10px] text-slate-500">
                  {formatMessageTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form
        onSubmit={handleSend}
        className="border-t border-slate-800 bg-slate-950/80 p-3.5 flex items-center gap-2.5"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
        />
        <Button
          type="submit"
          disabled={!inputText.trim()}
          leftIcon={<Send className="w-4 h-4" />}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
