import { calculateRisk } from "../src/scorer";
import { checkNameRisk } from "../src/name-checker";
import type { Env } from "../src/types";

const mockEnv: Env = {
  RTO_DATA: {
    get: async (key: string) => {
      const pincodes: Record<string, any> = {
        "pincode:847101": { pincode: "847101", district: "Darbhanga", state: "Bihar", rtoRate: 0.41 },
        "pincode:560038": { pincode: "560038", district: "Bangalore", state: "Karnataka", rtoRate: 0.02 },
        "pincode:854301": { pincode: "854301", district: "Araria", state: "Bihar", rtoRate: 0.38 },
        "pincode:110001": { pincode: "110001", district: "New Delhi", state: "Delhi", rtoRate: 0.08 },
      };
      return pincodes[key] || null;
    },
    put: async () => {},
    list: async () => ({ keys: [], list_complete: true }),
  } as any,
  RISK_THRESHOLD: "75",
  PREPAID_DISCOUNT_PERCENT: "10",
  NATIONAL_RTO_AVERAGE: "0.15",
};

async function runTests() {
  console.log("=== RTO Firewall Test Suite ===\n");

  console.log("--- Name Checker Tests ---");
  const nameTests = [
    { name: "test123", expectHigh: true },
    { name: "asdf", expectHigh: true },
    { name: "Rahul Kumar", expectHigh: false },
    { name: "admin", expectHigh: true },
    { name: "Priya Singh", expectHigh: false },
    { name: "xxx", expectHigh: true },
    { name: "a", expectHigh: true },
    { name: "12345", expectHigh: true },
    { name: "John Doe", expectHigh: true },
    { name: "Amit Patel", expectHigh: false },
  ];

  for (const t of nameTests) {
    const result = checkNameRisk(t.name);
    const pass = t.expectHigh ? result.score > 0.5 : result.score < 0.5;
    console.log(`  ${pass ? "PASS" : "FAIL"} | "${t.name}" → score: ${result.score.toFixed(2)}, reason: ${result.reason || "none"}`);
  }

  console.log("\n--- Risk Scoring Tests ---");
  const riskTests = [
    { pincode: "847101", name: "test123", expectAction: "block" as const, desc: "Darbhanga + fake name" },
    { pincode: "560038", name: "Rahul Kumar", expectAction: "allow" as const, desc: "Bangalore + real name" },
    { pincode: "854301", name: "asdf", expectAction: "block" as const, desc: "Araria + keyboard pattern" },
    { pincode: "110001", name: "Amit Patel", expectAction: "allow" as const, desc: "Delhi + real name" },
    { pincode: "847101", name: "", expectAction: "block" as const, desc: "Darbhanga + no name" },
    { pincode: "560038", name: "test", expectAction: "allow" as const, desc: "Bangalore + test name (low pincode risk)" },
  ];

  for (const t of riskTests) {
    const risk = await calculateRisk(
      { pincode: t.pincode, name: t.name, time: Date.now() },
      mockEnv
    );
    const pass = risk.action === t.expectAction;
    console.log(`  ${pass ? "PASS" : "FAIL"} | ${t.desc}`);
    console.log(`         Score: ${risk.score}%, Action: ${risk.action}, Expected: ${t.expectAction}`);
    console.log(`         Reasons: ${risk.reasons.map(r => r.label).join(", ") || "none"}`);
  }

  console.log("\n--- Shipping Info API Test ---");
  const shippingInput = {
    order_id: "test_order_123",
    razorpay_order_id: "order_test",
    email: "test123@gmail.com",
    contact: "+919876543210",
    addresses: [{ id: "0", zipcode: "847101", country: "IN" }],
  };

  const risk = await calculateRisk(
    { pincode: "847101", email: "test123@gmail.com", time: Date.now() },
    mockEnv
  );

  const codAllowed = risk.score <= 75;
  console.log(`  Pincode: 847101 (Darbhanga)`);
  console.log(`  Risk Score: ${risk.score}%`);
  console.log(`  COD Allowed: ${codAllowed}`);
  console.log(`  Expected: false (should be blocked)`);
  console.log(`  Result: ${codAllowed ? "FAIL" : "PASS"}`);

  console.log("\n--- Low Risk Shipping Test ---");
  const risk2 = await calculateRisk(
    { pincode: "560038", email: "rahul@gmail.com", time: Date.now() },
    mockEnv
  );
  const codAllowed2 = risk2.score <= 75;
  console.log(`  Pincode: 560038 (Bangalore)`);
  console.log(`  Risk Score: ${risk2.score}%`);
  console.log(`  COD Allowed: ${codAllowed2}`);
  console.log(`  Expected: true (should be allowed)`);
  console.log(`  Result: ${codAllowed2 ? "PASS" : "FAIL"}`);

  console.log("\n=== All Tests Complete ===");
}

runTests().catch(console.error);
