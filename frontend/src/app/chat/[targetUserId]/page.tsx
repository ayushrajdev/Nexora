"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageSquare, Loader2 } from "lucide-react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ChatWindow } from "@/components/features/chat/ChatWindow";
import { useConnections } from "@/hooks/useConnections";
import { Avatar } from "@/components/ui/Avatar";
import { APP_ROUTES } from "@/config/routes";
import { cn, formatFullName } from "@/lib/utils";

export default function ChatRoomPage() {
  const params = useParams<{ targetUserId: string }>();
  const targetUserId = params?.targetUserId;
  const { connections, isLoading } = useConnections();

  const targetUser = useMemo(() => {
    const match = connections.find((c) => c.user?._id === targetUserId);
    return match?.user ?? null;
  }, [connections, targetUserId]);

  return (
    <AuthGuard>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Connections Switcher (Desktop) */}
          <div className="hidden lg:flex lg:col-span-4 flex-col h-[calc(100vh-8.5rem)] rounded-3xl border border-slate-800/90 bg-slate-900/75 overflow-hidden">
            <div className="border-b border-slate-800 p-4 bg-slate-950/50">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-brand-500" />
                <span>Connections</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Switch active developer conversation
              </p>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {isLoading ? (
                <div className="flex h-36 items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                  <span>Loading...</span>
                </div>
              ) : (
                connections.map((item) => {
                  const dev = item.user;
                  if (!dev) return null;
                  const isActive = dev._id === targetUserId;

                  return (
                    <Link
                      key={item._id}
                      href={APP_ROUTES.CHAT_ROOM(dev._id)}
                      className={cn(
                        "flex items-center gap-3.5 p-4 transition-colors",
                        isActive
                          ? "bg-brand-500/15 border-l-2 border-brand-500"
                          : "hover:bg-slate-800/60"
                      )}
                    >
                      <Avatar
                        src={dev.photoUrl}
                        firstName={dev.firstName}
                        lastName={dev.lastName}
                        size="md"
                        isPremium={dev.isPremium}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {formatFullName(dev.firstName, dev.lastName)}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {dev.skills?.slice(0, 3).join(" • ") || dev.about}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Room */}
          <div className="lg:col-span-8">
            {targetUserId && (
              <ChatWindow
                targetUserId={targetUserId}
                targetUser={targetUser}
              />
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
