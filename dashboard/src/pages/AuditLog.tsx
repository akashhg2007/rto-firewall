import { useEffect, useState } from "react";
import { API_BASE } from "../config";

interface AuditEntry {
  orderId: string;
  timestamp: number;
  pincode: string;
  name?: string;
  email?: string;
  score: number;
  action: "allow" | "block";
  reasons: Array<{ code: string; label: string; weight: number }>;
  outcome?: string;
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "blocked" | "allowed">("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/dashboard/audit?limit=${pageSize}&offset=${page * pageSize}&filter=${filter}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries || []);
        setHasMore(data.hasMore || false);
        setLoading(false);
      })
      .catch(() => {
        setEntries([
          {
            orderId: "demo_001",
            timestamp: Date.now() - 3600000,
            pincode: "847101",
            name: "test123",
            score: 89,
            action: "block",
            reasons: [
              { code: "high_rto_pincode", label: "Pincode 847101 has 41% RTO rate", weight: 0.35 },
              { code: "suspicious_name", label: "Contains 'test'", weight: 0.25 },
            ],
          },
          {
            orderId: "demo_002",
            timestamp: Date.now() - 1800000,
            pincode: "560038",
            name: "Rahul Kumar",
            score: 12,
            action: "allow",
            reasons: [],
          },
          {
            orderId: "demo_003",
            timestamp: Date.now() - 900000,
            pincode: "854301",
            name: "asdf",
            score: 82,
            action: "block",
            reasons: [
              { code: "high_rto_pincode", label: "Pincode 854301 has 38% RTO rate", weight: 0.32 },
              { code: "suspicious_name", label: "Keyboard pattern", weight: 0.25 },
              { code: "late_night_order", label: "Order placed at 0:00", weight: 0.10 },
            ],
          },
        ]);
        setHasMore(false);
        setLoading(false);
      });
  }, [page, filter]);

  const filtered = entries.filter((e) => {
    if (filter === "blocked") return e.action === "block";
    if (filter === "allowed") return e.action === "allow";
    return true;
  });

  function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function getScoreColor(score: number): string {
    if (score > 75) return "text-red-400 bg-red-500/10";
    if (score > 50) return "text-orange-400 bg-orange-500/10";
    if (score > 25) return "text-yellow-400 bg-yellow-500/10";
    return "text-emerald-400 bg-emerald-500/10";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Log</h2>
          <p className="text-gray-400 text-sm mt-1">
            Every blocked/allowed decision with full reasoning
          </p>
        </div>
        <div className="flex gap-2">
          {(["all", "blocked", "allowed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-gray-500">
          Loading audit log...
        </div>
      ) : (
        <>
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left text-sm text-gray-400">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Pincode</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Reasons</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={entry.orderId}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30"
                >
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {formatTime(entry.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                    {entry.orderId.slice(0, 12)}...
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {entry.pincode}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {entry.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-sm font-bold ${getScoreColor(
                        entry.score
                      )}`}
                    >
                      {entry.score}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        entry.action === "block"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {entry.action === "block" ? "BLOCKED" : "ALLOWED"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 max-w-xs">
                    {entry.reasons.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5">
                        {entry.reasons.map((r, i) => (
                          <li key={i}>{r.label}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No audit entries found
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-400">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasMore}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
