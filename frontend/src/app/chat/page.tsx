"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Users, Compass, Loader2 } from "lucide-react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { useConnections } from "@/hooks/useConnections";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { APP_ROUTES } from "@/config/routes";
import { formatFullName } from "@/lib/utils";

export default function ChatIndexPage() {
  const { connections, isLoading } = useConnections();

  return (
    <AuthGuard>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Connections Sidebar */}
          <div className="lg:col-span-4 flex flex-col h-[calc(100vh-8.5rem)] rounded-3xl border border-slate-800/90 bg-slate-900/75 overflow-hidden">
            <div className="border-b border-slate-800 p-4 bg-slate-950/50">
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-brand-500" />
                <span>Developer Messages</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Select a matched connection to chat live
              </p>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {isLoading ? (
                <div className="flex h-48 items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                  <span>Loading connections...</span>
                </div>
              ) : connections.length === 0 ? (
                <div className="p-6 text-center space-y-3">
                  <Users className="mx-auto h-8 w-8 text-slate-500" />
                  <p className="text-xs text-slate-400">
                    No active connections yet. Match with developers first to unlock
                    real-time chat!
                  </p>
                  <Link href={APP_ROUTES.FEED} className="inline-block">
                    <Button size="sm" variant="outline">
                      Find Developers
                    </Button>
                  </Link>
                </div>
              ) : (
                connections.map((item) => {
                  const dev = item.user;
                  if (!dev) return null;
                  return (
                    <Link
                      key={item._id}
                      href={APP_ROUTES.CHAT_ROOM(dev._id)}
                      className="flex items-center gap-3.5 p-4 hover:bg-slate-800/60 transition-colors"
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
                          {dev.skills?.slice(0, 3).join(" • ") ||
                            dev.about ||
                            "Tap to open chat room"}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Empty State Pane */}
          <div className="hidden lg:flex lg:col-span-8 h-[calc(100vh-8.5rem)] flex-col items-center justify-center rounded-3xl border border-slate-800/90 bg-slate-900/40 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-400 mb-4">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Real-Time Socket.IO Workspace
            </h2>
            <p className="mt-2 max-w-md text-xs text-slate-400 leading-relaxed">
              Choose a developer from your connections list on the left to start an
              instant WebSocket conversation through the DevTinder API Gateway.
            </p>
            <Link href={APP_ROUTES.FEED} className="mt-5">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Compass className="w-4 h-4" />}
              >
                Discover More Builders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
