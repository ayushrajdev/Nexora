"use client";

import React from "react";
import Link from "next/link";
import { Users, Search, Compass, Loader2, RefreshCw } from "lucide-react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ConnectionCard } from "@/components/features/connections/ConnectionCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useConnections } from "@/hooks/useConnections";
import { APP_ROUTES } from "@/config/routes";

export default function ConnectionsPage() {
  const {
    connections,
    totalConnections,
    searchQuery,
    setSearchQuery,
    isLoading,
    error,
    refreshConnections,
  } = useConnections();

  return (
    <AuthGuard>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Users className="h-6 w-6 text-brand-500" />
              <span>Your Connections</span>
              <span className="rounded-full bg-brand-500/15 border border-brand-500/30 px-2.5 py-0.5 text-xs font-bold text-brand-300">
                {totalConnections}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Developers you&apos;ve mutually matched with — start a real-time chat anytime
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search by name, skill, or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={refreshConnections}
              title="Refresh connections"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
            <p className="text-sm">Loading your developer network...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-6 text-center space-y-3">
            <p className="text-sm text-rose-200">{error}</p>
            <Button variant="secondary" size="sm" onClick={refreshConnections}>
              Retry
            </Button>
          </div>
        ) : connections.length === 0 ? (
          <div className="mx-auto max-w-md rounded-3xl border border-slate-800/90 bg-slate-900/60 p-8 text-center space-y-4 my-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-400">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {searchQuery ? "No matching connections" : "No connections yet"}
              </h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {searchQuery
                  ? `No connected developers matched "${searchQuery}".`
                  : "Head to the discovery feed to swipe right on developers you'd love to build with!"}
              </p>
            </div>
            {!searchQuery && (
              <Link href={APP_ROUTES.FEED} className="inline-block pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Compass className="w-4 h-4" />}
                >
                  Explore Discovery Feed
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {connections.map((conn) => (
              <ConnectionCard key={conn._id} connection={conn} />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
