import type { RazorpayWebhookEvent, AuditEntry, Env } from "./types";

async function verifySignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSignature === signature;
}

export async function handleWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  const signature = request.headers.get("x-razorpay-signature");
  const body = await request.text();

  if (env.RAZORPAY_WEBHOOK_SECRET) {
    const valid = await verifySignature(body, signature, env.RAZORPAY_WEBHOOK_SECRET);
    if (!valid) {
      return new Response("Invalid signature", { status: 401 });
    }
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const orderId =
    event.payload.payment?.entity?.order_id ||
    event.payload.order?.entity?.id ||
    "unknown";

  const existing = await env.RTO_DATA.get<AuditEntry>(`order:${orderId}`, {
    type: "json",
  });

  if (!existing) {
    await env.RTO_DATA.put(
      `order:${orderId}`,
      JSON.stringify({
        orderId,
        timestamp: Date.now(),
        pincode: "unknown",
        score: 0,
        action: "allow",
        reasons: [],
        outcome: "pending",
      }),
      { expirationTtl: 86400 * 90 }
    );
  }

  const audit = existing || {
    orderId,
    timestamp: Date.now(),
    pincode: "unknown",
    score: 0,
    action: "allow",
    reasons: [],
    outcome: "pending" as const,
  };

  switch (event.event) {
    case "payment.captured":
      audit.outcome = audit.score > 50 ? "converted" : "delivered";
      break;
    case "payment.failed":
      audit.outcome = "delivered";
      break;
    case "order.placed":
      audit.outcome = "pending";
      break;
    default:
      break;
  }

  await env.RTO_DATA.put(`order:${orderId}`, JSON.stringify(audit), {
    expirationTtl: 86400 * 90,
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
  if (audit.action === "block") stats.blocked++;
  if (event.event === "payment.captured" && audit.score > 50) stats.converted++;
  if (event.event === "fulfillment.returned") stats.rto++;

  await env.RTO_DATA.put(statsKey, JSON.stringify(stats), {
    expirationTtl: 86400 * 30,
  });

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
