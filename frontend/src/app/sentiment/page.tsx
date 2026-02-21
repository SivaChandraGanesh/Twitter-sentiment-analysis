"use client";

import { useState } from "react";
import Header from "@/components/Header";
import SentimentBadge from "@/components/SentimentBadge";
import type { Sentiment } from "@/lib/types";

const SENTIMENT_DATA = [
  {
    timestamp: "Oct 24, 09:42 AM",
    text: "The new UI update is absolutely incredible. Everything feels so m...",
    sentiment: "Positive" as Sentiment,
    confidence: 98.4,
  },
  {
    timestamp: "Oct 24, 09:38 AM",
    text: "Received the package today. It was on time. Standard shipping ...",
    sentiment: "Neutral" as Sentiment,
    confidence: 76.2,
  },
  {
    timestamp: "Oct 24, 09:35 AM",
    text: "Really frustrated with the support wait times. I've been on hold fo...",
    sentiment: "Negative" as Sentiment,
    confidence: 92.1,
  },
  {
    timestamp: "Oct 24, 09:30 AM",
    text: "Love the color options available this season. Will definitely be buy...",
    sentiment: "Positive" as Sentiment,
    confidence: 88.5,
  },
  {
    timestamp: "Oct 24, 09:25 AM",
    text: "App keeps crashing when I try to upload photos. Please fix this b...",
    sentiment: "Negative" as Sentiment,
    confidence: 95.8,
  },
];

export default function SentimentPage() {
  const [filter, setFilter] = useState<"all" | Sentiment>("all");

  const filteredData =
    filter === "all" ? SENTIMENT_DATA : SENTIMENT_DATA.filter((d) => d.sentiment === filter);

  const getConfidenceColor = (sentiment: Sentiment) => {
    if (sentiment === "Positive") return "bg-green-500";
    if (sentiment === "Negative") return "bg-red-500";
    return "bg-gray-400";
  };

  return (
    <div className="flex flex-col bg-white">
      <Header
        title="Sentiment Classification Results"
        subtitle="Analyzing 12,480 entries across social, web, and internal channels."
      />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div></div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <span>📥</span> Export CSV
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <span>🔄</span> Re-run Analysis
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="absolute right-4 top-4 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              +12.5%
            </div>
            <div className="mb-2 text-3xl">😊</div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Positive Sentiments
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">8,432</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-[67%] rounded-full bg-green-500" />
            </div>
          </div>
          <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="absolute right-4 top-4 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
              -0.8%
            </div>
            <div className="mb-2 text-3xl">😐</div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Neutral Sentiments
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">2,904</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-[23%] rounded-full bg-gray-400" />
            </div>
          </div>
          <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="absolute right-4 top-4 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              -4.2%
            </div>
            <div className="mb-2 text-3xl">😞</div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Negative Sentiments
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">1,144</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-[9%] rounded-full bg-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            {(["all", "Positive", "Neutral", "Negative"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f === "all" ? "all" : f)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {f === "all" ? "All Results" : f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by keyword..."
                className="rounded-lg border border-gray-300 bg-white pl-10 pr-10 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">⚙️</span>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-700">TIMESTAMP</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">TEXT SNIPPET</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">SENTIMENT</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">CONFIDENCE</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{row.timestamp}</td>
                    <td className="max-w-md px-4 py-3 text-gray-700">{row.text}</td>
                    <td className="px-4 py-3">
                      <SentimentBadge sentiment={row.sentiment} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full ${getConfidenceColor(row.sentiment)}`}
                            style={{ width: `${row.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {row.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-gray-400 hover:text-gray-600">⋯</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-600">Showing 1 to 5 of 12,480 results.</p>
            <div className="flex items-center gap-2">
              <button className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">
                ‹
              </button>
              <button className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white">
                1
              </button>
              <button className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">
                2
              </button>
              <button className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">
                3
              </button>
              <span className="px-2 text-gray-500">...</span>
              <button className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">
                250
              </button>
              <button className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
          © 2024 Data Driven Emotion. All AI processing secured.
          <span className="mx-2">•</span>
          <a href="#" className="hover:text-gray-700">Privacy Policy</a>
          <span className="mx-2">•</span>
          <a href="#" className="hover:text-gray-700">Documentation</a>
          <span className="mx-2">•</span>
          <a href="#" className="hover:text-gray-700">API Reference</a>
        </div>
      </div>
    </div>
  );
}
