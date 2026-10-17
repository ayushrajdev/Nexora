"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { ReceivedConnectionRequest, ReviewStatus } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatFullName } from "@/lib/utils";

interface RequestCardProps {
  request: ReceivedConnectionRequest;
  onReview: (
    status: ReviewStatus,
    request: ReceivedConnectionRequest
  ) => Promise<void>;
  isProcessing: boolean;
}

export function RequestCard({
  request,
  onReview,
  isProcessing,
}: RequestCardProps) {
  const sender = request.fromUser;
  if (!sender) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800/90 bg-slate-900/75 p-5 transition-all hover:border-slate-700">
      <div className="flex items-start gap-4 min-w-0">
        <Avatar
          src={sender.photoUrl}
          firstName={sender.firstName}
          lastName={sender.lastName}
          size="lg"
          isPremium={sender.isPremium}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-white">
              {formatFullName(sender.firstName, sender.lastName)}
            </h3>
            <Badge variant="brand">Wants to connect</Badge>
          </div>

          {(sender.age || sender.gender) && (
            <p className="text-xs text-slate-400 capitalize mt-0.5">
              {[sender.age ? `${sender.age} yrs` : null, sender.gender]
                .filter(Boolean)
                .join(" • ")}
            </p>
          )}

          <p className="mt-1.5 text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {sender.about || "Interested in collaborating with you!"}
          </p>

          {sender.skills && sender.skills.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {sender.skills.slice(0, 6).map((skill) => (
                <Badge key={skill} variant="default">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 sm:self-center">
        <Button
          variant="danger"
          size="sm"
          disabled={isProcessing}
          onClick={() => onReview("rejected", request)}
          leftIcon={<X className="w-4 h-4" />}
        >
          Ignore
        </Button>
        <Button
          variant="success"
          size="sm"
          isLoading={isProcessing}
          onClick={() => onReview("accepted", request)}
          leftIcon={<Check className="w-4 h-4" />}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
