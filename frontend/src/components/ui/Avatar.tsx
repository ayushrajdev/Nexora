"use client";

import React, { useState } from "react";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  firstName?: string;
  lastName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isPremium?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
};

export function Avatar({
  src,
  firstName,
  lastName,
  size = "md",
  isPremium = false,
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(firstName, lastName);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 font-bold text-white select-none shrink-0 overflow-hidden",
        sizeMap[size],
        isPremium && "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950",
        className
      )}
    >
      {src && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={firstName || "Developer"}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
