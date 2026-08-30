import { useState, useEffect, useRef, useCallback } from "react";

interface RiskOutput {
  score: number;
  action: "allow" | "block";
  reasons: Array<{ code: string; label: string; weight: number }>;
  breakdown: {
    pincode: number;
    name: number;
    device: number;
    time: number;
    product: number;
  };
}

interface UseRTORiskOptions {
  pincode?: string;
  name?: string;
  email?: string;
  endpoint?: string;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseRTORiskResult {
  risk: RiskOutput | null;
  loading: boolean;
  error: string | null;
  shouldHideCOD: boolean;
}

const riskCache = new Map<string, RiskOutput>();

export function useRTORisk(options: UseRTORiskOptions): UseRTORiskResult {
  const {
    pincode,
    name,
    email,
    endpoint = "https://rto-firewall.your-domain.workers.dev/api/score",
    debounceMs = 300,
    enabled = true,
  } = options;

  const [risk, setRisk] = useState<RiskOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchRisk = useCallback(
    async (postcode: string, custName?: string, custEmail?: string) => {
      const cacheKey = `${postcode}:${custName || ""}:${custEmail || ""}`;

      if (riskCache.has(cacheKey)) {
        const cached = riskCache.get(cacheKey)!;
        setRisk(cached);
        setLoading(false);
        return;
      }

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pincode: postcode,
            name: custName,
            email: custEmail,
            time: Date.now(),
            device:
              typeof navigator !== "undefined" ? navigator.userAgent : "server",
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: RiskOutput = await res.json();
        riskCache.set(cacheKey, data);
        setRisk(data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to fetch risk score");
        }
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  useEffect(() => {
    if (!enabled || !pincode || pincode.length < 6) {
      setRisk(null);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      fetchRisk(pincode, name, email);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pincode, name, email, debounceMs, enabled, fetchRisk]);

  return {
    risk,
    loading,
    error,
    shouldHideCOD: risk ? risk.score > 75 : false,
  };
}
