import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "brand"
  | "emerald"
  | "gold"
  | "silver";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeStyles: Record<BadgeVariant, string> = {
  default:
    "bg-slate-800/90 text-slate-200 border-slate-700/80 hover:border-slate-600",
  brand:
    "bg-brand-500/15 text-brand-300 border-brand-500/30",
  emerald:
    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  gold:
    "bg-amber-500/15 text-amber-300 border-amber-400/40",
  silver:
    "bg-slate-300/15 text-slate-200 border-slate-400/40",
};

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        badgeStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
