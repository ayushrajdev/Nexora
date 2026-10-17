"use client";

import React from "react";
import Link from "next/link";
import {
  Flame,
  Code2,
  MessageSquare,
  Zap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { APP_ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const FEATURES = [
  {
    icon: Code2,
    title: "Match by Tech Stack",
    description:
      "Filter and swipe through developers who share your passion for TypeScript, Rust, Go, AI, or distributed systems.",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Socket.IO Chat",
    description:
      "Once mutually matched, jump straight into low-latency WebSocket rooms to share ideas, repos, and architecture.",
  },
  {
    icon: ShieldCheck,
    title: "Zero-Trust Gateway Auth",
    description:
      "Backed by Redis + MongoDB dual-layer HTTP-only session cookies and microservices architecture.",
  },
];

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 py-8 lg:py-16">
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <Badge variant="brand" className="px-3.5 py-1 text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Microservices-Powered Developer Networking
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Swipe Right on Your Next{" "}
            <span className="bg-gradient-to-r from-brand-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              Co-Founder or Pair Programmer
            </span>
          </h1>

          <p className="max-w-2xl mx-auto lg:mx-0 text-base sm:text-lg text-slate-300 leading-relaxed">
            DevTinder connects ambitious software engineers, open-source maintainers,
            and indie hackers. Discover builders by their tech stack, review incoming
            requests, and collaborate over real-time chat.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            {isAuthenticated ? (
              <>
                <Link href={APP_ROUTES.FEED}>
                  <Button
                    size="lg"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Open Discovery Feed
                  </Button>
                </Link>
                <Link href={APP_ROUTES.PROFILE}>
                  <Button variant="secondary" size="lg">
                    Welcome back, {user?.firstName}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href={APP_ROUTES.SIGNUP}>
                  <Button
                    size="lg"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Create Developer Profile
                  </Button>
                </Link>
                <Link href={APP_ROUTES.LOGIN}>
                  <Button variant="secondary" size="lg">
                    Sign In to Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hero Mockup Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 font-bold text-white">
                  SN
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Satya Nadella, 56
                  </h3>
                  <p className="text-xs text-slate-400">
                    Principal Cloud Architect
                  </p>
                </div>
              </div>
              <Badge variant="gold">GOLD</Badge>
            </div>

            <p className="mt-4 text-xs text-slate-300 leading-relaxed">
              &ldquo;Building distributed AI infrastructure and cloud-native developer
              platforms. Looking for Rust & TypeScript enthusiasts to ship open-source
              tools!&rdquo;
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {["TypeScript", "Rust", "Kubernetes", "Redis", "System Design"].map(
                (skill) => (
                  <Badge key={skill} variant="brand">
                    {skill}
                  </Badge>
                )
              )}
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-950/80 p-3 border border-slate-800/80">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <Zap className="w-4 h-4" />
                <span>98% Stack Match</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-400 font-semibold">
                <Flame className="w-4 h-4 fill-brand-500/20" />
                <span>Interested</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 transition-all hover:border-slate-700"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
