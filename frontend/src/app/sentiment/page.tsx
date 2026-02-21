"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import SentimentBadge from "@/components/SentimentBadge";
import { runSentiment, getCsvExportUrl, getDashboardData } from "@/lib/api";
import type { Sentiment } from "@/lib/types";

type SentimentRow = {
  id: number;
  text: string;
  clean_text?: string;
  sentiment: Sentiment;
  confidence: number;
};

export default function SentimentPage() {
  const [filter, setFilter] = useState<"all" | Sentiment>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    total: number;
    counts: Record<string, number>;
    table: SentimentRow[];
  } | null>(null);

  useEffect(() => {
    // Check if data already exists (fetch via dashboard/visualize data)
    getDashboardData()
      .then((res) => {
        if (res && res.total > 0) {
          // Trigger a silent run to populate the table, or just wait for click
          // For now, let's just trigger the full fetch
          handleRunAnalysis();
        }
      })
      .catch(() => null);
  }, []);

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runSentiment();
      setData(result as { total: number; counts: Record<string, number>; table: SentimentRow[] });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed. Upload and preprocess a dataset first.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTable = data?.table.filter(
    (row) => filter === "all" || row.sentiment === filter
  ) ?? [];

  const getConfidenceColor = (sentiment: Sentiment) => {
    if (sentiment === "Positive") return "bg-green-500";
    if (sentiment === "Negative") return "bg-red-500";
    return "bg-gray-400";
  };

  return (
    <div className="flex flex-col bg-white">
      <Header
        title="Sentiment Classification"
        breadcrumbs={["Analytics", "Sentiment"]}
        subtitle="Run sentiment analysis on your uploaded dataset using the trained ML model."
      />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            {(["all", "Positive", "Neutral", "Negative"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === f
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {f === "all" ? "All Results" : f}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <a
              href={getCsvExportUrl()}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <span>📥</span> Export CSV
            </a>
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <span>{loading ? "⏳" : "🔄"}</span>
              {loading ? "Running..." : "Run Analysis"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {/* Summary Cards */}
        {data && (
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {(["Positive", "Neutral", "Negative"] as const).map((s) => (
              <div key={s} className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-2 text-3xl">
                  {s === "Positive" ? "😊" : s === "Negative" ? "😞" : "😐"}
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {s} Sentiments
                </p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {(data.counts[s] ?? 0).toLocaleString()}
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${s === "Positive" ? "bg-green-500" : s === "Negative" ? "bg-red-500" : "bg-gray-400"
                      }`}
                    style={{ width: `${Math.round(((data.counts[s] ?? 0) / data.total) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {Math.round(((data.counts[s] ?? 0) / data.total) * 100)}% of total
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {data ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-700">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">TEXT SNIPPET</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">SENTIMENT</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">CONFIDENCE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTable.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 text-xs">{row.id}</td>
                      <td className="max-w-md px-4 py-3 text-gray-700">
                        {String(row.text).slice(0, 120)}
                        {row.text?.length > 120 ? "..." : ""}
                      </td>
                      <td className="px-4 py-3">
                        <SentimentBadge sentiment={row.sentiment} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${getConfidenceColor(row.sentiment)}`}
                              style={{ width: `${Math.round(row.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {Math.round(row.confidence * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
              Showing up to 50 of {filteredTable.length.toLocaleString()} results
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400 space-y-4">
            <span className="text-6xl">💬</span>
            <p className="text-lg font-medium">Click "Run Analysis" to classify sentiments</p>
            <p className="text-sm">Make sure a dataset has been uploaded and preprocessed first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
