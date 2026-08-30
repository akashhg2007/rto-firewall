import type { RiskInput, RiskOutput, Reason, ScoreBreakdown, Env } from "./types";
import { getPincodeRisk } from "./pincodes";
import { checkNameRisk } from "./name-checker";

const WEIGHTS = {
  pincode: 0.50,
  name: 0.30,
  device: 0.05,
  time: 0.05,
  product: 0.10,
};

const HIGH_RISK_PRODUCT_CATEGORIES: Record<string, number> = {
  "white-shoes": 0.7,
  "white-sneakers": 0.7,
  electronics: 0.6,
  phones: 0.65,
  "high-value-apparel": 0.5,
  "premium-shoes": 0.6,
  shoes: 0.5,
  sneakers: 0.55,
};

const LOW_RISK_PRODUCT_CATEGORIES: Record<string, number> = {
  books: 0.1,
  accessories: 0.15,
  "home-decor": 0.2,
  "basic-apparel": 0.2,
};

function getDeviceRisk(userAgent: string | undefined): number {
  if (!userAgent) return 0.5;

  const ua = userAgent.toLowerCase();

  if (
    ua.includes("bot") ||
    ua.includes("crawler") ||
    ua.includes("spider") ||
    ua.includes("curl") ||
    ua.includes("wget") ||
    ua.includes("python")
  ) {
    return 0.9;
  }

  if (ua.includes("iphone") || ua.includes("ipad")) {
    return 0.1;
  }

  if (ua.includes("macintosh") || ua.includes("mac os")) {
    return 0.15;
  }

  if (ua.includes("windows")) {
    return 0.2;
  }

  if (ua.includes("linux") && ua.includes("android")) {
    const hasHighEnd =
      ua.includes("sm-s9") ||
      ua.includes("sm-s10") ||
      ua.includes("sm-s2") ||
      ua.includes("pixel");
    return hasHighEnd ? 0.2 : 0.5;
  }

  if (ua.includes("android")) {
    return 0.5;
  }

  return 0.3;
}

function getTimeRisk(timestamp: number | undefined): number {
  if (!timestamp) return 0.4;

  const date = new Date(timestamp);
  const hour = date.getHours();

  if (hour >= 0 && hour < 4) return 0.9;
  if (hour >= 4 && hour < 8) return 0.6;
  if (hour >= 8 && hour < 12) return 0.1;
  if (hour >= 12 && hour < 14) return 0.15;
  if (hour >= 14 && hour < 18) return 0.2;
  if (hour >= 18 && hour < 22) return 0.1;
  return 0.6;
}

function getProductRisk(
  category: string | undefined,
  merchantRiskMap?: Record<string, number>
): number {
  if (!category) return 0.3;

  const normalized = category.toLowerCase().replace(/\s+/g, "-");

  if (merchantRiskMap && merchantRiskMap[normalized] !== undefined) {
    return merchantRiskMap[normalized];
  }

  if (HIGH_RISK_PRODUCT_CATEGORIES[normalized] !== undefined) {
    return HIGH_RISK_PRODUCT_CATEGORIES[normalized];
  }

  if (LOW_RISK_PRODUCT_CATEGORIES[normalized] !== undefined) {
    return LOW_RISK_PRODUCT_CATEGORIES[normalized];
  }

  return 0.3;
}

export async function calculateRisk(
  input: RiskInput,
  env: Env
): Promise<RiskOutput> {
  const reasons: Reason[] = [];

  const pincodeData = await getPincodeRisk(input.pincode, env);
  let pincodeScore: number;
  if (pincodeData.rtoRate >= 0.30) {
    pincodeScore = Math.min(pincodeData.rtoRate * 2.8, 1.0);
  } else if (pincodeData.rtoRate >= 0.20) {
    pincodeScore = Math.min(pincodeData.rtoRate * 2.5, 0.9);
  } else {
    pincodeScore = Math.min(pincodeData.rtoRate * 2.0, 0.6);
  }
  if (pincodeData.rtoRate > 0.2) {
    reasons.push({
      code: "high_rto_pincode",
      label: `Pincode ${input.pincode} has ${(pincodeData.rtoRate * 100).toFixed(0)}% RTO rate`,
      weight: pincodeScore * WEIGHTS.pincode,
    });
  }

  const nameResult = checkNameRisk(input.name);
  const nameScore = nameResult.score;
  if (nameResult.reason && nameScore > 0.3) {
    reasons.push({
      code: "suspicious_name",
      label: nameResult.reason,
      weight: nameScore * WEIGHTS.name,
    });
  }

  const deviceScore = getDeviceRisk(input.device);
  if (deviceScore > 0.4) {
    reasons.push({
      code: "risky_device",
      label: deviceScore > 0.7
        ? "Bot/crawler detected"
        : "Low-end Android device",
      weight: deviceScore * WEIGHTS.device,
    });
  }

  const timeScore = getTimeRisk(input.time);
  if (timeScore > 0.5) {
    const hour = input.time ? new Date(input.time).getHours() : 0;
    reasons.push({
      code: "late_night_order",
      label: `Order placed at ${hour}:00 — unusual shopping hour`,
      weight: timeScore * WEIGHTS.time,
    });
  }

  const productScore = getProductRisk(input.productCategory);
  if (productScore > 0.4) {
    reasons.push({
      code: "high_risk_product",
      label: `${input.productCategory || "Unknown"} — high RTO category`,
      weight: productScore * WEIGHTS.product,
    });
  }

  const breakdown: ScoreBreakdown = {
    pincode: pincodeScore,
    name: nameScore,
    device: deviceScore,
    time: timeScore,
    product: productScore,
  };

  const rawScore =
    pincodeScore * WEIGHTS.pincode +
    nameScore * WEIGHTS.name +
    deviceScore * WEIGHTS.device +
    timeScore * WEIGHTS.time +
    productScore * WEIGHTS.product;

  const score = Math.round(Math.min(rawScore * 100, 100));
  const threshold = parseInt(env.RISK_THRESHOLD || "75", 10);

  return {
    score,
    action: score > threshold ? "block" : "allow",
    reasons,
    breakdown,
  };
}
