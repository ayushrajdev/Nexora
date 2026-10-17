"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { matchingService } from "@/services/matching.service";
import { normalizeApiError } from "@/lib/api-client";
import { ConnectionItem } from "@/types";

export function useConnections() {
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await matchingService.getConnections();
      setConnections(data);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const filteredConnections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return connections;

    return connections.filter((item) => {
      const u = item.user;
      if (!u) return false;
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const about = (u.about || "").toLowerCase();
      const hasSkill = u.skills?.some((s) => s.toLowerCase().includes(q));
      return fullName.includes(q) || about.includes(q) || Boolean(hasSkill);
    });
  }, [connections, searchQuery]);

  return {
    connections: filteredConnections,
    totalConnections: connections.length,
    searchQuery,
    setSearchQuery,
    isLoading,
    error,
    refreshConnections: fetchConnections,
  };
}
