const RISK_API_URL = "https://rto-firewall.your-domain.workers.dev/api/score";
const RISK_THRESHOLD = 75;

interface RiskResponse {
  score: number;
  action: "allow" | "block";
}

async function fetchRiskScore(pincode: string): Promise<RiskResponse> {
  try {
    const res = await fetch(RISK_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pincode, time: Date.now() }),
      signal: AbortSignal.timeout(200),
    });
    if (!res.ok) return { score: 0, action: "allow" };
    return await res.json();
  } catch {
    return { score: 0, action: "allow" };
  }
}

export function cartPaymentMethodsTransformRun(input: any) {
  const noChanges = { operations: [] };

  const pincode = input.cart?.buyerIdentity?.deliveryAddress?.zipCode;
  if (!pincode) return noChanges;

  const risk = fetchRiskScore(pincode);
  if (risk.score <= RISK_THRESHOLD) return noChanges;

  const codMethod = input.paymentMethods?.find(
    (method: any) =>
      method.name?.toLowerCase().includes("cash on delivery") ||
      method.name?.toLowerCase().includes("cod")
  );

  if (!codMethod) return noChanges;

  return {
    operations: [
      {
        paymentMethodHide: {
          paymentMethodId: codMethod.id,
        },
      },
    ],
  };
}
