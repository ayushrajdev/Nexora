"use client";

import React from "react";
import Link from "next/link";
import { UserPlus, Compass, Loader2, RefreshCw } from "lucide-react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { RequestCard } from "@/components/features/connections/RequestCard";
import { Button } from "@/components/ui/Button";
import { useRequests } from "@/hooks/useRequests";
import { APP_ROUTES } from "@/config/routes";

export default function RequestsPage() {
  const {
    requests,
    isLoading,
    processingId,
    error,
    reviewRequest,
    refreshRequests,
  } = useRequests();

  return (
    <AuthGuard>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <UserPlus className="h-6 w-6 text-brand-500" />
              <span>Connection Requests</span>
              <span className="rounded-full bg-brand-500/15 border border-brand-500/30 px-2.5 py-0.5 text-xs font-bold text-brand-300">
                {requests.length}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Developers who swiped right on your profile — accept to unlock real-time chat
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={refreshRequests}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
            <p className="text-sm">Checking incoming connection requests...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-6 text-center space-y-3">
            <p className="text-sm text-rose-200">{error}</p>
            <Button variant="secondary" size="sm" onClick={refreshRequests}>
              Retry
            </Button>
          </div>
        ) : requests.length === 0 ? (
          <div className="mx-auto max-w-md rounded-3xl border border-slate-800/90 bg-slate-900/60 p-8 text-center space-y-4 my-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-400">
              <UserPlus className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Inbox Zero! No pending requests
              </h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                You&apos;ve reviewed all incoming requests. Keep swiping in the
                discovery feed to meet more builders!
              </p>
            </div>
            <Link href={APP_ROUTES.FEED} className="inline-block pt-2">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Compass className="w-4 h-4" />}
              >
                Go to Discovery Feed
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <RequestCard
                key={req._id}
                request={req}
                onReview={reviewRequest}
                isProcessing={processingId === req._id}
              />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
