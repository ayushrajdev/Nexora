"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Sparkles } from "lucide-react";
import { ConnectionItem } from "@/types";
import { APP_ROUTES } from "@/config/routes";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatFullName } from "@/lib/utils";

interface ConnectionCardProps {
  connection: ConnectionItem;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
  const dev = connection.user;
  if (!dev) return null;

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5 transition-all hover:border-slate-700 hover:bg-slate-900 shadow-lg">
      <div>
        <div className="flex items-start gap-4">
          <Avatar
            src={dev.photoUrl}
            firstName={dev.firstName}
            lastName={dev.lastName}
            size="lg"
            isPremium={dev.isPremium}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white truncate">
                {formatFullName(dev.firstName, dev.lastName)}
              </h3>
              {dev.isPremium && (
                <Badge variant="gold">
                  <Sparkles className="w-3 h-3" />
                  PRO
                </Badge>
              )}
            </div>
            {(dev.age || dev.gender) && (
              <p className="text-xs text-slate-400 capitalize mt-0.5">
                {[dev.age ? `${dev.age} yrs` : null, dev.gender]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {dev.about || "Ready to collaborate and ship cool projects."}
            </p>
          </div>
        </div>

        {dev.skills && dev.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {dev.skills.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="default" className="text-[11px]">
                {skill}
              </Badge>
            ))}
            {dev.skills.length > 5 && (
              <Badge variant="default" className="text-[11px]">
                +{dev.skills.length - 5}
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-end">
        <Link href={APP_ROUTES.CHAT_ROOM(dev._id)} className="w-full">
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            leftIcon={<MessageSquare className="w-4 h-4" />}
          >
            Open Real-Time Chat
          </Button>
        </Link>
      </div>
    </div>
  );
}
