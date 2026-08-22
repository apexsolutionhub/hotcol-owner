import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPropertyCafeReport } from "./queries";
import type { CafePeriodReport } from "./types";

export type CafeReportPeriod = "Daily" | "Monthly";

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function useCafeReport(
  tin: string | null,
  enabled: boolean,
  period: CafeReportPeriod,
  selectedDate: Date,
) {
  const [data, setData] = useState<CafePeriodReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!tin || !enabled) {
        setData(null);
        setLoading(false);
        setRefreshing(false);
        setError(null);
        return;
      }
      const id = ++requestId.current;
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const result = await fetchPropertyCafeReport(tin, period, toYmd(selectedDate));
        if (id !== requestId.current) return;
        setData(result);
      } catch (e: any) {
        if (id !== requestId.current) return;
        setError(e?.message || "Failed to load café report");
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [tin, enabled, period, selectedDate],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: () => load("refresh"),
  };
}

export { toYmd };
