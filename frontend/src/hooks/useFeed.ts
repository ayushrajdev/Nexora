"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { matchingService } from "@/services/matching.service";
import { normalizeApiError } from "@/lib/api-client";
import { SwipeStatus, UserProfile } from "@/types";
import { useToast } from "@/context/ToastContext";

export function useFeed() {
  const [candidates, setCandidates] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const { toast } = useToast();

  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await matchingService.getDiscoveryFeed({
        page: pageNum,
        limit: 15,
      });
      setCandidates((prev) => (append ? [...prev, ...data] : data));
    } catch (err) {
      const apiErr = normalizeApiError(err);
      setError(apiErr.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1, false);
  }, [fetchFeed]);

  const filteredCandidates = useMemo(() => {
    if (!selectedSkill) return candidates;
    return candidates.filter((candidate) =>
      candidate.skills?.some(
        (s) => s.toLowerCase() === selectedSkill.toLowerCase()
      )
    );
  }, [candidates, selectedSkill]);

  const availableSkills = useMemo(() => {
    const skillSet = new Set<string>();
    candidates.forEach((c) => {
      c.skills?.forEach((s) => skillSet.add(s));
    });
    return Array.from(skillSet).slice(0, 12);
  }, [candidates]);

  const handleSwipe = useCallback(
    async (status: SwipeStatus, targetUser: UserProfile) => {
      if (isSwiping) return;
      setIsSwiping(true);

      // Optimistic removal from feed stack
      const previousCandidates = candidates;
      setCandidates((prev) => prev.filter((u) => u._id !== targetUser._id));

      try {
        await matchingService.sendConnectionRequest(status, targetUser._id);
        if (status === "interested") {
          toast({
            title: `Interested in ${targetUser.firstName}!`,
            description: `Connection request sent to ${targetUser.firstName}.`,
            variant: "success",
          });
        }
      } catch (err) {
        setCandidates(previousCandidates);
        const apiErr = normalizeApiError(err);
        toast({
          title: "Swipe action failed",
          description: apiErr.message,
          variant: "error",
        });
      } finally {
        setIsSwiping(false);
      }
    },
    [candidates, isSwiping, toast]
  );

  const reloadFeed = useCallback(() => {
    setPage(1);
    fetchFeed(1, false);
  }, [fetchFeed]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, true);
  }, [fetchFeed, page]);

  return {
    candidates: filteredCandidates,
    currentCandidate: filteredCandidates[0] ?? null,
    nextCandidate: filteredCandidates[1] ?? null,
    totalRemaining: filteredCandidates.length,
    availableSkills,
    selectedSkill,
    setSelectedSkill,
    isLoading,
    isSwiping,
    error,
    handleSwipe,
    reloadFeed,
    loadMore,
  };
}
