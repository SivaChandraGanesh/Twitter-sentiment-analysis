"use client";

import Header from "@/components/Header";
import { useWebSocket } from "@/lib/useWebSocket";
import { getCsvExportUrl } from "@/lib/api";
import {
  BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";

const EMOTION_EMOJIS: Record<string, string> = {
  Happy: "😄", Joy: "😄", Anger: "😠", Angry: "😠", Sadness: "😢", Sad: "😢",
  Fear: "😨", Surprise: "😲", Disgust: "🤢", Neutral: "😐", Anticipation: "🤔", Trust: "🤝",
};
const COLORS = ["#fbbf24", "#ef4444", "#3b82f6", "#a855f7", "#22c55e", "#f97316", "#06b6d4", "#84cc16"];

export default function EmotionPage() {
  const { connected, streamRunning, stats, records } = useWebSocket();

  const total = stats.total;
  const emotionData = Object.entries(stats.emotion).map(([name, count], i) => ({
    name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0, color: COLORS[i % COLORS.length],
  }));
  const dominant = emotionData.sort((a, b) => b.count - a.count)[0];

  // Last 20 records for live feed
  const recentEmotions = records.slice(0, 20);

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <Header
        title="Live Emotion Detection"
        breadcrumbs={["Analytics", "Emotion"]}
        subtitle="Emotion categories update in real time as the stream runs."
      />
      <div className="flex-1 p-6">
        {/* Status */}
        <div className="mb-6 flex items-center justify-between">
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${streamRunning ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
            <span className={`h-2 w-2 rounded-full ${streamRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            {streamRunning ? "LIVE — Emotion chart morphs automatically" : "Stream stopped"}
          </span>
          <a href={getCsvExportUrl()} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            📥 Export CSV
          </a>
        </div>

        {/* Top Cards */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {/* Dominant Emotion */}
          <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="absolute right-4 top-4 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              {streamRunning ? "● LIVE" : "STATIC"}
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">DOMINANT EMOTION</p>
            <div className="flex items-center gap-4">
              <span className="text-5xl">{EMOTION_EMOJIS[dominant?.name ?? ""] ?? "🧠"}</span>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{dominant?.name ?? "—"}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {dominant ? `${dominant.count.toLocaleString()} records (${dominant.pct}%)` : "Stream not started"}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
              <div>
                <p className="text-xs text-gray-500">TOTAL RECORDS</p>
                <p className="text-xl font-bold text-gray-900">{total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">EMOTIONS FOUND</p>
                <p className="text-xl font-bold text-gray-900">{emotionData.length}</p>
              </div>
            </div>
          </div>

          {/* Recent live emotion feed */}
          <div className="rounded-xl border border-gray-200 bg-blue-600 p-6 text-white shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-100">LATEST EMOTIONS</p>
            <div className="h-40 overflow-y-auto space-y-1">
              {recentEmotions.length === 0 ? (
                <p className="text-sm text-blue-200">Start the stream to see live emotions.</p>
              ) : recentEmotions.map((r, i) => (
                <div key={`${r.id}-${i}`} className="flex items-center gap-2 text-sm">
                  <span>{EMOTION_EMOJIS[r.emotion] ?? "🧠"}</span>
                  <span className="text-blue-100 font-medium">{r.emotion}</span>
                  <span className="text-blue-300 text-xs ml-auto truncate max-w-[120px]">{r.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emotion Bar Chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Emotion Distribution</h3>
          {emotionData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-gray-400">
              Start the stream to see the chart.
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emotionData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v) => [`${v} records`, "Count"]} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {emotionData.map((e, i) => (
                      <Cell key={e.name} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Emotion Tiles */}
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {emotionData.map((e) => (
              <div key={e.name} className="rounded-lg border border-gray-200 p-3 text-center">
                <div className="text-2xl">{EMOTION_EMOJIS[e.name] ?? "🧠"}</div>
                <p className="mt-1 text-xs font-semibold uppercase text-gray-700">{e.name}</p>
                <p className="text-lg font-bold text-gray-900">{e.count}</p>
                <p className="text-xs text-gray-500">{e.pct}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
