import { HIGH_RTO_PINCODES } from "../data/pincodes";

interface KVEntry {
  key: string;
  value: string;
}

async function generateBulkEntries(): Promise<KVEntry[]> {
  const entries: KVEntry[] = [];

  for (const pin of HIGH_RTO_PINCODES) {
    entries.push({
      key: `pincode:${pin.pincode}`,
      value: JSON.stringify({
        pincode: pin.pincode,
        district: pin.district,
        state: pin.state,
        rtoRate: pin.rtoRate,
      }),
    });

    entries.push({
      key: `district:${pin.pincode}`,
      value: JSON.stringify({
        district: pin.district,
        state: pin.state,
      }),
    });
  }

  const defaultConfig = {
    merchantId: "default",
    threshold: 75,
    discountPercent: 10,
    productRiskMap: {
      "white-shoes": 0.7,
      electronics: 0.6,
      phones: 0.65,
      shoes: 0.5,
      sneakers: 0.55,
      books: 0.1,
      accessories: 0.15,
    },
  };

  entries.push({
    key: "config:default",
    value: JSON.stringify(defaultConfig),
  });

  return entries;
}

async function main() {
  console.log("Generating KV bulk entries...");
  const entries = await generateBulkEntries();
  console.log(`Generated ${entries.length} entries (${HIGH_RTO_PINCODES.length} pincodes x 2 + config)`);

  const fs = await import("fs");
  const path = await import("path");
  const outputPath = path.join(__dirname, "..", "data", "kv-bulk.json");
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2));
  console.log(`Written to ${outputPath}`);
  console.log("\nTo seed KV, run:");
  console.log(`npx wrangler kv bulk put --namespace-id=YOUR_ID ./data/kv-bulk.json`);
}

main().catch(console.error);
