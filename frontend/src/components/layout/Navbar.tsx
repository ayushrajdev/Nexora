"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  Compass,
  Users,
  UserPlus,
  MessageSquare,
  Crown,
  UserCircle,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { APP_ROUTES } from "@/config/routes";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn, formatFullName } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Discover",
    href: APP_ROUTES.FEED,
    icon: Compass,
  },
  {
    label: "Connections",
    href: APP_ROUTES.CONNECTIONS,
    icon: Users,
  },
  {
    label: "Requests",
    href: APP_ROUTES.REQUESTS,
    icon: UserPlus,
  },
  {
    label: "Chat",
    href: APP_ROUTES.CHAT,
    icon: MessageSquare,
  },
  {
    label: "Premium",
    href: APP_ROUTES.PREMIUM,
    icon: Crown,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href={isAuthenticated ? APP_ROUTES.FEED : APP_ROUTES.HOME}
          className="flex items-center gap-2.5 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-rose-400 shadow-md shadow-brand-600/30 group-hover:scale-105 transition-transform">
            <Flame className="h-5 w-5 text-white fill-white/20" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-white">
              Dev<span className="text-brand-500">Tinder</span>
            </span>
            {user?.isPremium && (
              <Badge variant="gold" className="hidden sm:inline-flex">
                <Sparkles className="w-3 h-3" />
                {user.membershipType?.toUpperCase() || "PRO"}
              </Badge>
            )}
          </div>
        </Link>

        {/* Center Navigation (Authenticated) */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-900/90 p-1 border border-slate-800/80">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-gradient-to-r from-brand-600 to-rose-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right User Controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <Link
                href={APP_ROUTES.PROFILE}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 transition-all",
                  pathname === APP_ROUTES.PROFILE
                    ? "border-brand-500/60 bg-brand-500/10"
                    : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                )}
              >
                <Avatar
                  src={user.photoUrl}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  size="sm"
                  isPremium={user.isPremium}
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-100 leading-tight">
                    {formatFullName(user.firstName, user.lastName)}
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <UserCircle className="w-3 h-3 text-brand-400" />
                    Edit Profile
                  </p>
                </div>
              </Link>

              <button
                onClick={logout}
                title="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-400 hover:border-rose-500/40 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href={APP_ROUTES.LOGIN}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href={APP_ROUTES.SIGNUP}
                className="rounded-xl bg-gradient-to-r from-brand-600 to-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-brand-600/20 hover:from-brand-500 hover:to-rose-400 transition-all"
              >
                Join DevTinder
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {isAuthenticated && (
        <nav className="flex md:hidden items-center justify-around border-t border-slate-800/80 bg-slate-950/95 px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors",
                  isActive
                    ? "text-brand-400"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
