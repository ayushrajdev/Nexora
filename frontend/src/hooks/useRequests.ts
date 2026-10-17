"use client";

import { useCallback, useEffect, useState } from "react";
import { matchingService } from "@/services/matching.service";
import { normalizeApiError } from "@/lib/api-client";
import { ReceivedConnectionRequest, ReviewStatus } from "@/types";
import { useToast } from "@/context/ToastContext";

export function useRequests() {
  const [requests, setRequests] = useState<ReceivedConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await matchingService.getReceivedRequests();
      setRequests(data);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const reviewRequest = useCallback(
    async (
      status: ReviewStatus,
      requestItem: ReceivedConnectionRequest
    ): Promise<void> => {
      setProcessingId(requestItem._id);
      const previous = requests;
      setRequests((prev) => prev.filter((r) => r._id !== requestItem._id));

      try {
        await matchingService.reviewConnectionRequest(status, requestItem._id);
        const senderName = requestItem.fromUser?.firstName || "Developer";
        toast({
          title:
            status === "accepted"
              ? `Connected with ${senderName}!`
              : `Request dismissed`,
          description:
            status === "accepted"
              ? `You can now message ${senderName} in real-time chat.`
              : `Connection request from ${senderName} was rejected.`,
          variant: status === "accepted" ? "success" : "info",
        });
      } catch (err) {
        setRequests(previous);
        toast({
          title: "Could not review request",
          description: normalizeApiError(err).message,
          variant: "error",
        });
      } finally {
        setProcessingId(null);
      }
    },
    [requests, toast]
  );

  return {
    requests,
    isLoading,
    processingId,
    error,
    reviewRequest,
    refreshRequests: fetchRequests,
  };
}
