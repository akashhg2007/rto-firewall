import { useState } from "react";
import Overview from "./pages/Overview";
import AuditLog from "./pages/AuditLog";
import Settings from "./pages/Settings";

type Page = "overview" | "audit" | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("overview");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-bold text-sm">
                RF
              </div>
              <h1 className="text-lg font-semibold">RTO Firewall</h1>
            </div>
            <div className="flex gap-1">
              {(["overview", "audit", "settings"] as Page[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    page === p
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  }`}
                >
                  {p === "overview" ? "Overview" : p === "audit" ? "Audit Log" : "Settings"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {page === "overview" && <Overview />}
        {page === "audit" && <AuditLog />}
        {page === "settings" && <Settings />}
      </main>
    </div>
  );
}
