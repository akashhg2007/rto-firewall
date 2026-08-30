import type { PincodeRTO, Env } from "./types";
import { HIGH_RTO_PINCODES } from "../data/pincodes";

const HARDCODED_PINCODES = new Map<string, PincodeRTO>();
for (const p of HIGH_RTO_PINCODES) {
  HARDCODED_PINCODES.set(p.pincode, p);
}

const NATIONAL_AVERAGE = 0.15;

const STATE_AVERAGES: Record<string, number> = {
  "Uttar Pradesh": 0.22,
  "Bihar": 0.28,
  "Jharkhand": 0.20,
  "West Bengal": 0.18,
  "Odisha": 0.17,
  "Rajasthan": 0.19,
  "Madhya Pradesh": 0.16,
  "Punjab": 0.18,
  "Haryana": 0.17,
  "Jammu and Kashmir": 0.25,
  "Assam": 0.22,
  "Chhattisgarh": 0.14,
  "Uttarakhand": 0.13,
  "Himachal Pradesh": 0.12,
  "Delhi": 0.10,
  "Karnataka": 0.09,
  "Maharashtra": 0.11,
  "Gujarat": 0.08,
  "Tamil Nadu": 0.07,
  "Kerala": 0.06,
  "Telangana": 0.09,
  "Andhra Pradesh": 0.10,
};

const DISTRICT_AVERAGES: Record<string, number> = {
  Darbhanga: 0.41,
  Araria: 0.38,
  Kishanganj: 0.36,
  Supaul: 0.35,
  Madhepura: 0.34,
  Saharsa: 0.33,
  Purnia: 0.32,
  Katihar: 0.31,
  Balrampur: 0.30,
  Bahraich: 0.29,
  Shravasti: 0.28,
  Gonda: 0.27,
  Basti: 0.26,
  Siddharthnagar: 0.25,
  Mahrajganj: 0.24,
  Deoria: 0.23,
  Gorakhpur: 0.22,
  Azamgarh: 0.21,
  Mau: 0.20,
  Ballia: 0.19,
};

export async function getPincodeRisk(
  pincode: string,
  env: Env
): Promise<PincodeRTO> {
  const cached = await env.RTO_DATA.get<PincodeRTO>(`pincode:${pincode}`, {
    type: "json",
  });
  if (cached) return cached;

  const hardcoded = HARDCODED_PINCODES.get(pincode);
  if (hardcoded) return hardcoded;

  const districtKey = `district:${pincode}`;
  const districtData = await env.RTO_DATA.get<{
    district: string;
    state: string;
  }>(districtKey, { type: "json" });

  if (districtData) {
    const rtoRate =
      DISTRICT_AVERAGES[districtData.district] ??
      STATE_AVERAGES[districtData.state] ??
      NATIONAL_AVERAGE;

    return {
      pincode,
      district: districtData.district,
      state: districtData.state,
      rtoRate,
    };
  }

  return {
    pincode,
    district: "Unknown",
    state: "Unknown",
    rtoRate: NATIONAL_AVERAGE,
  };
}

export async function getPincodeStats(
  env: Env
): Promise<{ total: number; highRTO: number }> {
  const list = await env.RTO_DATA.list({ prefix: "pincode:" });
  let highRTO = 0;
  for (const key of list.keys) {
    const data = await env.RTO_DATA.get<PincodeRTO>(key.name, {
      type: "json",
    });
    if (data && data.rtoRate > 0.25) highRTO++;
  }
  return { total: list.keys.length, highRTO };
}
