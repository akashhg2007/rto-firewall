import { useState } from "react";

interface Config {
  threshold: number;
  discountPercent: number;
  productRiskMap: Record<string, number>;
}

export default function Settings() {
  const [config, setConfig] = useState<Config>({
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
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-gray-400 text-sm mt-1">
          Configure risk thresholds and discount rules
        </p>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 space-y-6">
        <h3 className="text-lg font-semibold">Risk Threshold</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-gray-400">
              Orders above this score get COD hidden
            </label>
            <span className="text-2xl font-bold text-emerald-400">
              {config.threshold}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.threshold}
            onChange={(e) =>
              setConfig({ ...config, threshold: parseInt(e.target.value) })
            }
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0 (Permissive)</span>
            <span>50</span>
            <span>100 (Strict)</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 space-y-6">
        <h3 className="text-lg font-semibold">Prepaid Discount</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-gray-400">
              Discount offered to high-risk customers
            </label>
            <span className="text-2xl font-bold text-amber-400">
              {config.discountPercent}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={config.discountPercent}
            onChange={(e) =>
              setConfig({
                ...config,
                discountPercent: parseInt(e.target.value),
              })
            }
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 space-y-4">
        <h3 className="text-lg font-semibold">Product Risk Mapping</h3>
        <p className="text-sm text-gray-400">
          Risk multiplier for product categories (0 = no risk, 1 = max risk)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(config.productRiskMap).map(([category, risk]) => (
            <div key={category} className="flex items-center gap-3">
              <label className="text-sm text-gray-300 w-32 capitalize">
                {category.replace(/-/g, " ")}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={risk * 100}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    productRiskMap: {
                      ...config.productRiskMap,
                      [category]: parseInt(e.target.value) / 100,
                    },
                  })
                }
                className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-sm text-gray-400 w-10 text-right">
                {(risk * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${
            saved
              ? "bg-emerald-500 text-black"
              : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          }`}
        >
          {saved ? "Saved!" : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
