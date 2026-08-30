export interface RTOFirewallConfig {
  apiKey?: string;
  endpoint: string;
  threshold?: number;
}

export interface RiskInput {
  pincode: string;
  name?: string;
  email?: string;
  productId?: string;
  productCategory?: string;
}

export interface RiskOutput {
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

export class RTOFirewall {
  private endpoint: string;
  private threshold: number;
  private cache: Map<string, RiskOutput> = new Map();

  constructor(config: RTOFirewallConfig) {
    this.endpoint = config.endpoint;
    this.threshold = config.threshold ?? 75;
  }

  async score(input: RiskInput): Promise<RiskOutput> {
    const cacheKey = `${input.pincode}:${input.name || ""}:${input.email || ""}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 200);

    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          time: Date.now(),
          device: typeof navigator !== "undefined" ? navigator.userAgent : "server",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        return this.fallback();
      }

      const data: RiskOutput = await res.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch {
      clearTimeout(timeout);
      return this.fallback();
    }
  }

  shouldHideCOD(risk: RiskOutput): boolean {
    return risk.score > this.threshold;
  }

  getPrepaidDiscount(risk: RiskOutput, defaultPercent = 10): number {
    return risk.score > this.threshold ? defaultPercent : 0;
  }

  private fallback(): RiskOutput {
    return {
      score: 0,
      action: "allow",
      reasons: [],
      breakdown: { pincode: 0, name: 0, device: 0, time: 0, product: 0 },
    };
  }
}
