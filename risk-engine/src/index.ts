import { calculateRisk } from "./scorer";
import { getPincodeRisk } from "./pincodes";
import { handleWebhook } from "./webhook-handler";
import type {
  Env,
  RiskInput,
  ShippingInfoRequest,
  ShippingInfoResponse,
  PromotionsRequest,
  AuditEntry,
} from "./types";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Razorpay-Signature",
    "Content-Type": "application/json",
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(),
  });
}

async function handleScore(request: Request, env: Env): Promise<Response> {
  const input: RiskInput = await request.json();

  if (!input.pincode) {
    return json({ error: "pincode is required" }, 400);
  }

  input.time = input.time || Date.now();

  const result = await calculateRisk(input, env);

  const orderId = `demo_${Date.now()}`;
  const auditEntry: AuditEntry = {
    orderId,
    timestamp: Date.now(),
    pincode: input.pincode,
    name: input.name,
    email: input.email,
    score: result.score,
    action: result.action,
    reasons: result.reasons,
    outcome: "pending",
  };

  await env.RTO_DATA.put(`order:${orderId}`, JSON.stringify(auditEntry), {
    expirationTtl: 86400 * 30,
  });

  const today = new Date().toISOString().split("T")[0];
  const statsKey = `stats:${today}`;
  const stats = await env.RTO_DATA.get<{
    analyzed: number;
    blocked: number;
    converted: number;
    rto: number;
  }>(statsKey, { type: "json" }) || { analyzed: 0, blocked: 0, converted: 0, rto: 0 };

  stats.analyzed++;
  if (result.action === "block") stats.blocked++;
  await env.RTO_DATA.put(statsKey, JSON.stringify(stats), {
    expirationTtl: 86400 * 30,
  });

  const auditKey = `audit:${Date.now()}:${orderId}`;
  await env.RTO_DATA.put(auditKey, JSON.stringify(auditEntry), {
    expirationTtl: 86400 * 30,
  });

  return json(result);
}

async function handleShippingInfo(
  request: Request,
  env: Env
): Promise<Response> {
  const body: ShippingInfoRequest = await request.json();

  if (!body.addresses || body.addresses.length === 0) {
    return json({ error: "At least one address is required" }, 400);
  }

  const responses = await Promise.all(
    body.addresses.map(async (addr) => {
      const riskInput: RiskInput = {
        pincode: addr.zipcode,
        email: body.email,
        device: undefined,
        time: Date.now(),
      };

      const risk = await calculateRisk(riskInput, env);
      const threshold = parseInt(env.RISK_THRESHOLD || "75", 10);

      const codFee = risk.score > threshold ? 0 : 10000;

      await env.RTO_DATA.put(
        `order:${body.razorpay_order_id}`,
        JSON.stringify({
          orderId: body.razorpay_order_id,
          timestamp: Date.now(),
          pincode: addr.zipcode,
          email: body.email,
          score: risk.score,
          action: risk.action,
          reasons: risk.reasons,
          outcome: "pending",
        }),
        { expirationTtl: 86400 * 30 }
      );

      return {
        id: addr.id,
        zipcode: addr.zipcode,
        country: addr.country,
        shipping_methods: [
          {
            id: "standard",
            name: "Standard Delivery",
            description: "Delivered in 5-7 days",
            serviceable: true,
            shipping_fee: 10000,
            cod: risk.score <= threshold,
            cod_fee: codFee,
          },
          {
            id: "express",
            name: "Express Delivery",
            description: "Delivered in 2-3 days",
            serviceable: true,
            shipping_fee: 20000,
            cod: risk.score <= threshold,
            cod_fee: codFee,
          },
        ],
      };
    })
  );

  return json({ addresses: responses });
}

async function handlePromotions(
  request: Request,
  env: Env
): Promise<Response> {
  const body: PromotionsRequest = await request.json();

  const orderData = await env.RTO_DATA.get<AuditEntry>(
    `order:${body.razorpay_order_id}`,
    { type: "json" }
  );

  const discountPercent = parseInt(env.PREPAID_DISCOUNT_PERCENT || "10", 10);

  const coupons = [];

  if (orderData && orderData.score > 50) {
    coupons.push({
      code: `PREPAID${discountPercent}`,
      description: `${discountPercent}% OFF on prepaid — faster, safer delivery`,
      type: "percent",
      value: discountPercent,
      minimum_order_value: 0,
      prepaid_only: true,
    });
  }

  if (orderData && orderData.score > 75) {
    coupons.push({
      code: "FREESHIP",
      description: "FREE shipping on prepaid orders",
      type: "fixed",
      value: 100,
      minimum_order_value: 0,
      prepaid_only: true,
    });
  }

  return json({ coupons });
}

async function handleGetStats(env: Env): Promise<Response> {
  const today = new Date().toISOString().split("T")[0];
  const statsKey = `stats:${today}`;
  const stats = await env.RTO_DATA.get<{
    analyzed: number;
    blocked: number;
    converted: number;
    rto: number;
  }>(statsKey, { type: "json" }) || { analyzed: 0, blocked: 0, converted: 0, rto: 0 };

  const blockedCost = stats.blocked * 400;
  const recoveredAmount = stats.converted * 3500;

  return json({
    analyzed: stats.analyzed,
    blocked: stats.blocked,
    moneySaved: blockedCost,
    converted: stats.converted,
    recoveredAmount,
    rto: stats.rto,
    date: today,
  });
}

async function handleGetAudit(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const filter = url.searchParams.get("filter") || "all";

  const list = await env.RTO_DATA.list({
    prefix: "audit:",
    limit: limit + offset + 100,
  });

  const entries: AuditEntry[] = [];
  for (const key of list.keys) {
    const data = await env.RTO_DATA.get<AuditEntry>(key.name, {
      type: "json",
    });
    if (data) {
      if (filter === "blocked" && data.action !== "block") continue;
      if (filter === "allowed" && data.action !== "allow") continue;
      entries.push(data);
    }
  }

  entries.sort((a, b) => b.timestamp - a.timestamp);
  const paginated = entries.slice(offset, offset + limit);

  return json({
    entries: paginated,
    total: entries.length,
    limit,
    offset,
    hasMore: offset + limit < entries.length,
  });
}

async function handleCSVUpload(
  request: Request,
  env: Env
): Promise<Response> {
  const body = await request.json();
  const { pincodes, merchantId } = body as {
    pincodes: Array<{ pincode: string; rtoRate: number; district?: string; state?: string }>;
    merchantId?: string;
  };

  if (!pincodes || !Array.isArray(pincodes)) {
    return json({ error: "pincodes array is required" }, 400);
  }

  let uploaded = 0;
  for (const pin of pincodes) {
    if (!pin.pincode || typeof pin.rtoRate !== "number") continue;

    const data = {
      pincode: pin.pincode,
      district: pin.district || "Unknown",
      state: pin.state || "Unknown",
      rtoRate: Math.min(Math.max(pin.rtoRate, 0), 1),
    };

    await env.RTO_DATA.put(`pincode:${pin.pincode}`, JSON.stringify(data));
    uploaded++;
  }

  return json({ success: true, uploaded, total: pincodes.length });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/api/score" && request.method === "POST") {
        return await handleScore(request, env);
      }
      if (path === "/razorpay/shipping-info" && request.method === "POST") {
        return await handleShippingInfo(request, env);
      }
      if (path === "/razorpay/get-promotions" && request.method === "POST") {
        return await handlePromotions(request, env);
      }
      if (path === "/webhook/razorpay" && request.method === "POST") {
        return await handleWebhook(request, env);
      }
      if (path === "/api/dashboard/stats" && request.method === "GET") {
        return await handleGetStats(env);
      }
      if (path === "/api/dashboard/audit" && request.method === "GET") {
        return await handleGetAudit(request, env);
      }
      if (path === "/api/upload/pincodes" && request.method === "POST") {
        return await handleCSVUpload(request, env);
      }
      if (path === "/api/health") {
        return json({ status: "ok", timestamp: Date.now() });
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: "Internal server error" }, 500);
    }
  },
};
