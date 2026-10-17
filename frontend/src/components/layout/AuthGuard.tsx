"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Flame } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { APP_ROUTES } from "@/config/routes";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(APP_ROUTES.LOGIN);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 border border-brand-500/30">
          <Flame className="h-7 w-7 text-brand-500 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
          <span>Verifying developer session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
