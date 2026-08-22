import { useCallback, useEffect, useRef, useState } from "react";
import { usePortfolio } from "./portfolio";

type State<T> = {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  tin: string | null;
  refresh: () => Promise<void>;
};

/**
 * Fetch data for the currently selected property. Re-runs whenever the selected
 * property changes. Returns loading/refreshing/error helpers for the screen.
 */
export function usePropertyData<T>(
  fetcher: (tin: string) => Promise<T>,
  enabled = true,
): State<T> {
  const { selectedTin } = usePortfolio();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!selectedTin || !enabled) {
        requestId.current += 1;
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
        const result = await fetcher(selectedTin);
        if (id !== requestId.current) return;
        setData(result);
      } catch (e: any) {
        if (id !== requestId.current) return;
        setError(e?.message || "Failed to load");
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedTin, enabled],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const refresh = useCallback(() => load("refresh"), [load]);

  return { data, loading, refreshing, error, tin: selectedTin, refresh };
}
