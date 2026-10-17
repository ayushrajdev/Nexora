"use client";

import React, { useState } from "react";
import {
  Heart,
  X,
  Code2,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { SwipeStatus, UserProfile } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { cn, formatFullName, getSafeAvatarUrl } from "@/lib/utils";
import { APP_CONFIG } from "@/config/env";

interface DeveloperCardProps {
  profile: UserProfile;
  onSwipe?: (status: SwipeStatus, profile: UserProfile) => void;
  isSwiping?: boolean;
  isPreview?: boolean;
  className?: string;
}

export function DeveloperCard({
  profile,
  onSwipe,
  isSwiping = false,
  isPreview = false,
  className,
}: DeveloperCardProps) {
  const [imgSrc, setImgSrc] = useState<string>(
    getSafeAvatarUrl(profile.photoUrl)
  );
  const [swipeDirection, setSwipeDirection] = useState<
    "left" | "right" | null
  >(null);

  // Sync image source when profile changes
  React.useEffect(() => {
    setImgSrc(getSafeAvatarUrl(profile.photoUrl));
    setSwipeDirection(null);
  }, [profile._id, profile.photoUrl]);

  const triggerAction = (status: SwipeStatus) => {
    if (!onSwipe || isSwiping) return;
    setSwipeDirection(status === "interested" ? "right" : "left");
    setTimeout(() => {
      onSwipe(status, profile);
    }, 180);
  };

  return (
    <div
      className={cn(
        "relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-900/95 shadow-2xl transition-all duration-200 select-none",
        swipeDirection === "right" &&
          "translate-x-16 rotate-6 opacity-0",
        swipeDirection === "left" &&
          "-translate-x-16 -rotate-6 opacity-0",
        className
      )}
    >
      {/* Hero Image Container */}
      <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={formatFullName(profile.firstName, profile.lastName)}
          onError={() => setImgSrc(APP_CONFIG.DEFAULT_AVATAR)}
          className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          {isPreview ? (
            <Badge variant="brand" className="backdrop-blur-md bg-slate-950/70">
              Live Card Preview
            </Badge>
          ) : (
            <Badge
              variant="default"
              className="backdrop-blur-md bg-slate-950/70 border-slate-700/70"
            >
              <Code2 className="w-3.5 h-3.5 text-brand-400" />
              Developer
            </Badge>
          )}

          {profile.isPremium && (
            <Badge variant="gold" className="backdrop-blur-md bg-slate-950/80">
              <Sparkles className="w-3 h-3" />
              {profile.membershipType?.toUpperCase() || "PREMIUM"}
            </Badge>
          )}
        </div>

        {/* Name & Demographics Overlay */}
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {formatFullName(profile.firstName, profile.lastName)}
            </h2>
            {profile.age && (
              <span className="text-xl font-semibold text-slate-300">
                {profile.age}
              </span>
            )}
          </div>

          {profile.gender && (
            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium capitalize text-slate-300">
              <UserIcon className="w-3.5 h-3.5 text-brand-400" />
              <span>{profile.gender}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Body: Bio & Tech Stack */}
      <div className="p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            About Builder
          </h3>
          <p className="text-sm text-slate-200 leading-relaxed line-clamp-3">
            {profile.about || "Passionate software builder ready to collaborate."}
          </p>
        </div>

        {/* Skills */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Tech Stack & Skills
          </h3>
          {profile.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="brand">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-slate-500">
              No skills listed yet
            </p>
          )}
        </div>

        {/* Swipe Action Buttons */}
        {!isPreview && onSwipe && (
          <div className="pt-3 flex items-center justify-center gap-6">
            <button
              type="button"
              disabled={isSwiping}
              onClick={() => triggerAction("ignored")}
              className="group flex h-14 w-14 items-center justify-center rounded-full border border-slate-700/80 bg-slate-950/90 text-slate-300 shadow-lg transition-all hover:scale-110 hover:border-rose-500/60 hover:bg-rose-950/50 hover:text-rose-400 active:scale-95 disabled:opacity-50"
              aria-label="Pass developer"
              title="Ignore (Left Arrow)"
            >
              <X className="h-6 w-6 transition-transform group-hover:-rotate-12" />
            </button>

            <button
              type="button"
              disabled={isSwiping}
              onClick={() => triggerAction("interested")}
              className="group flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-rose-500 text-white shadow-xl shadow-brand-600/30 transition-all hover:scale-110 hover:shadow-brand-500/50 active:scale-95 disabled:opacity-50"
              aria-label="Send interest"
              title="Interested (Right Arrow)"
            >
              <Heart className="h-7 w-7 fill-white/20 transition-transform group-hover:scale-110" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
