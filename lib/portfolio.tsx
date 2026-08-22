import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SELECTED_TIN_KEY } from "@/constants/config";
import { getItem, setItem } from "./storage";
import { fetchPortfolio } from "./queries";
import type { OwnerProperty, PortfolioSummary } from "./types";
import { useAuth } from "./auth";

type PortfolioState = {
  summary: PortfolioSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  properties: OwnerProperty[];
  selectedTin: string | null;
  selectProperty: (tin: string) => void;
  selected: OwnerProperty | null;
};

const PortfolioContext = createContext<PortfolioState | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { owner } = useAuth();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTin, setSelectedTin] = useState<string | null>(null);

  const properties = summary?.properties ?? [];

  const refresh = useCallback(async () => {
    if (!owner) return;
    setError(null);
    try {
      const data = await fetchPortfolio();
      setSummary(data);
      setSelectedTin((current) => {
        if (current && data.properties.some((p) => p.tinNumber === current)) {
          return current;
        }
        return (
          data.properties.find((property) => !property.accessBlocked)?.tinNumber ??
          data.properties[0]?.tinNumber ??
          null
        );
      });
    } catch (e: any) {
      setError(e?.message || "Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  }, [owner]);

  useEffect(() => {
    if (!owner) {
      setSummary(null);
      setSelectedTin(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const stored = await getItem(SELECTED_TIN_KEY);
      if (stored) setSelectedTin(stored);
      await refresh();
    })();
  }, [owner, refresh]);

  const selectProperty = useCallback((tin: string) => {
    setSelectedTin(tin);
    void setItem(SELECTED_TIN_KEY, tin);
  }, []);

  const selected = useMemo(
    () => properties.find((p) => p.tinNumber === selectedTin) ?? null,
    [properties, selectedTin],
  );

  const value = useMemo(
    () => ({
      summary,
      loading,
      error,
      refresh,
      properties,
      selectedTin,
      selectProperty,
      selected,
    }),
    [summary, loading, error, refresh, properties, selectedTin, selectProperty, selected],
  );

  return (
    <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
  );
}

export function usePortfolio(): PortfolioState {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}
