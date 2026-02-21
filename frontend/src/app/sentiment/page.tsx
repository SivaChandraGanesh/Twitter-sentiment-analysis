"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useWebSocket } from "@/lib/useWebSocket";
import { getCsvExportUrl, getDashboardData, getPreview } from "@/lib/api";
import type { LiveRecord } from "@/lib/useWebSocket";

const COLUMNS = ["Text", "Clean Text", "Sentiment", "Confidence", "Emotion", "Time"];
const SENTIMENT_COLORS: Record<string, string> = {
  Positive: "bg-green-100 text-green-700",
  Negative: "bg-red-100 text-red-700",
  Neutral: "bg-gray-100 text-gray-600",
};

export default function SentimentPage() {
  const { connected, streamRunning, stats, records: liveRecords } = useWebSocket();
  const [filter, setFilter] = useState<"all" | "Positive" | "Negative" | "Neutral">("all");
  const [dbStats, setDbStats] = useState<any>(null);
  const [dbRecords, setDbRecords] = useState<any[]>([]);

  useEffect(() => {
    // Fetch initial data from DB
    getDashboardData().then(setDbStats).catch(() => null);
    getPreview(50).then(res => setDbRecords(res.preview)).catch(() => null);
  }, []);

  // Merge statistics: use live stats if stream is active, else fall back to DB stats
  const total = streamRunning || stats.total > 0 ? stats.total : (dbStats?.total ?? 0);
  const pos = streamRunning || stats.total > 0 ? (stats.sentiment.Positive || 0) : (dbStats?.sentiment_distribution?.Positive || 0);
  const neg = streamRunning || stats.total > 0 ? (stats.sentiment.Negative || 0) : (dbStats?.sentiment_distribution?.Negative || 0);

  // Combine records: Live records first, then DB records (preventing duplicates if possible)
  const combinedRecords = [...liveRecords];
  const liveIds = new Set(liveRecords.map(r => r.id));
  dbRecords?.forEach(r => {
    if (r && !liveIds.has(r.id)) {
      combinedRecords.push({
        id: r.id,
        text: r.text,
        clean_text: r.clean_text,
        sentiment: r.sentiment,
        emotion: r.emotion,
        confidence: r.confidence,
        timestamp: r.created_at || new Date().toISOString()
      });
    }
  });

  const filtered: any[] = filter === "all" ? combinedRecords : combinedRecords.filter((r) => r.sentiment === filter);

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <Header
        title="Live Sentiment Analysis"
        breadcrumbs={["Analytics", "Sentiment"]}
        subtitle="Real-time sentiment labels arrive as the stream runs. Table updates automatically."
      />
      <div className="flex-1 p-6">
        {/* Status bar */}
        <div className="mb-6 flex items-center justify-between">
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${streamRunning ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
            <span className={`h-2 w-2 rounded-full ${streamRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            {streamRunning ? "LIVE — New rows appearing automatically" : "Stream stopped — start from Dashboard"}
          </span>
          <a href={getCsvExportUrl()} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            📥 Export CSV
          </a>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Analyzed", value: total.toLocaleString(), color: "text-gray-900" },
            { label: "Positive", value: `${total > 0 ? Math.round((pos / total) * 100) : 0}%`, color: "text-green-600" },
            { label: "Negative", value: `${total > 0 ? Math.round((neg / total) * 100) : 0}%`, color: "text-red-500" },
          ].map(c => (
            <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{c.label}</p>
              <p className={`mt-2 text-3xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="mb-4 flex gap-2">
          {(["all", "Positive", "Negative", "Neutral"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${filter === f ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}>
              {f === "all" ? `All (${combinedRecords.length})` : `${f} (${combinedRecords.filter((r: any) => r.sentiment === f).length})`}
            </button>
          ))}
        </div>

        {/* Live Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                  {COLUMNS.map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      No records yet. Start the stream from the Dashboard.
                    </td>
                  </tr>
                ) : filtered.map((r, i) => (
                  <tr key={`${r.id}-${i}`} className={i === 0 ? "bg-blue-50/40" : "hover:bg-gray-50"}>
                    <td className="max-w-[200px] px-4 py-3 text-gray-700 truncate">{r.text}</td>
                    <td className="max-w-[200px] px-4 py-3 text-gray-500 truncate">{r.clean_text}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${SENTIMENT_COLORS[r.sentiment] ?? "bg-gray-100 text-gray-600"}`}>
                        {r.sentiment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.round(r.confidence * 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{Math.round(r.confidence * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-blue-700 font-medium">{r.emotion}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(r.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
