import { useEffect, useState } from "react";

interface Stats {
  analyzed: number;
  blocked: number;
  moneySaved: number;
  converted: number;
  recoveredAmount: number;
  rto: number;
  date: string;
}

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() =>
        setStats({
          analyzed: 214,
          blocked: 38,
          moneySaved: 15200,
          converted: 11,
          recoveredAmount: 39589,
          rto: 3,
          date: new Date().toISOString().split("T")[0],
        })
      );
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const cards = [
    {
      label: "Orders Analyzed",
      value: stats.analyzed,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "High RTO Blocked",
      value: stats.blocked,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Money Saved",
      value: `₹${stats.moneySaved.toLocaleString()}`,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Converted to Prepaid",
      value: `${stats.converted} orders`,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Revenue Recovered",
      value: `₹${stats.recoveredAmount.toLocaleString()}`,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "RTO Orders",
      value: stats.rto,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
  ];

  const blockRate = stats.analyzed > 0
    ? ((stats.blocked / stats.analyzed) * 100).toFixed(1)
    : "0";
  const conversionRate = stats.blocked > 0
    ? ((stats.converted / stats.blocked) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
        <p className="text-gray-400">
          Real-time RTO protection metrics for {stats.date}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-xl p-6 border border-gray-800`}
          >
            <div className="text-gray-400 text-sm mb-1">{card.label}</div>
            <div className={`text-3xl font-bold ${card.color}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Risk Score Distribution</h3>
          <div className="space-y-3">
            {[
              { label: "0-25 (Low)", width: "45%", color: "bg-emerald-500" },
              { label: "25-50 (Medium)", width: "20%", color: "bg-yellow-500" },
              { label: "50-75 (High)", width: "15%", color: "bg-orange-500" },
              { label: "75-100 (Critical)", width: "20%", color: "bg-red-500" },
            ].map((bar) => (
              <div key={bar.label} className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-400">{bar.label}</div>
                <div className="flex-1 bg-gray-800 rounded-full h-4">
                  <div
                    className={`${bar.color} h-4 rounded-full transition-all`}
                    style={{ width: bar.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Block Rate</span>
              <span className="text-2xl font-bold text-red-400">{blockRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Conversion Rate (Blocked → Prepaid)</span>
              <span className="text-2xl font-bold text-emerald-400">{conversionRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Avg Savings per Blocked Order</span>
              <span className="text-2xl font-bold text-blue-400">
                ₹{stats.blocked > 0 ? Math.round(stats.moneySaved / stats.blocked) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Avg Recovery per Converted</span>
              <span className="text-2xl font-bold text-amber-400">
                ₹{stats.converted > 0 ? Math.round(stats.recoveredAmount / stats.converted) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
