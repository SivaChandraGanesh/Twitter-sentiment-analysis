"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { runEmotion, getCsvExportUrl, getDashboardData } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const EMOTION_EMOJIS: Record<string, string> = {
  Joy: "😄", Anger: "😠", Sadness: "😢",
  Fear: "😨", Surprise: "😲", Disgust: "🤢",
  Anticipation: "🤔", Trust: "🤝",
};

const EMOTION_COLORS: Record<string, string> = {
  Joy: "#fbbf24", Anger: "#ef4444", Sadness: "#3b82f6",
  Fear: "#a855f7", Surprise: "#22c55e", Disgust: "#f97316",
  Anticipation: "#06b6d4", Trust: "#84cc16",
};

type EmotionRow = {
  id: number;
  text: string;
  sentiment?: string;
  emotion: string;
  confidence?: number;
};

export default function EmotionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    total: number;
    emotion_counts: Record<string, number>;
    table: EmotionRow[];
  } | null>(null);

  useEffect(() => {
    handleRunEmotion();
  }, []);

  const handleRunEmotion = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runEmotion();
      setData(result as { total: number; emotion_counts: Record<string, number>; table: EmotionRow[] });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Emotion detection failed. Run sentiment analysis first.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = data
    ? Object.entries(data.emotion_counts).map(([name, count]) => ({
      name,
      count,
      fill: EMOTION_COLORS[name] ?? "#6366f1",
    }))
    : [];

  const dominant = chartData.sort((a, b) => b.count - a.count)[0];

  return (
    <div className="flex flex-col bg-white">
      <Header
        title="Emotion Detection Analytics"
        breadcrumbs={["Analytics", "Emotion"]}
        subtitle="Detect fine-grained emotional states across your dataset."
      />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div />
          <div className="flex gap-2">
            <a
              href={getCsvExportUrl()}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <span>📥</span> Export CSV
            </a>
            <button
              onClick={handleRunEmotion}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <span>{loading ? "⏳" : "🔍"}</span>
              {loading ? "Detecting..." : "Run Emotion Detection"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {!data ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400 space-y-4">
            <span className="text-6xl">🧠</span>
            <p className="text-lg font-medium">Click "Run Emotion Detection" to analyze emotions</p>
            <p className="text-sm">Requires sentiment analysis to be run first.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-6 lg:grid-cols-2">
              {/* Dominant State */}
              <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="absolute right-4 top-4 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  Analyzed
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  DOMINANT EMOTION
                </p>
                <div className="mb-4 flex items-center gap-4">
                  <div className="text-5xl">{EMOTION_EMOJIS[dominant?.name] ?? "🧠"}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{dominant?.name ?? "N/A"}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {dominant?.count.toLocaleString()} records out of {data.total.toLocaleString()} total
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                  <div>
                    <p className="text-xs text-gray-500">TOTAL RECORDS</p>
                    <p className="text-xl font-bold text-gray-900">{data.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">EMOTIONS DETECTED</p>
                    <p className="text-xl font-bold text-gray-900">
                      {Object.keys(data.emotion_counts).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Panel */}
              <div className="rounded-xl border border-gray-200 bg-blue-600 p-6 text-white shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-100">
                  TOTAL SAMPLES
                </p>
                <p className="mb-4 text-4xl font-bold">{data.total.toLocaleString()}</p>
                <div className="border-t border-blue-500 pt-4">
                  <p className="mb-2 text-xs text-blue-100">EMOTION SPREAD</p>
                  {chartData.slice(0, 3).map((e) => (
                    <p key={e.name} className="text-sm text-blue-200">
                      {EMOTION_EMOJIS[e.name] ?? "🧠"} {e.name}: {e.count}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Emotion Distribution Chart */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Emotion Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <rect key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Emotion cards */}
              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {chartData.map((e) => (
                  <div key={e.name} className="rounded-lg border border-gray-200 p-3 text-center">
                    <div className="text-2xl">{EMOTION_EMOJIS[e.name] ?? "🧠"}</div>
                    <p className="mt-1 text-xs font-semibold text-gray-700 uppercase">{e.name}</p>
                    <p className="text-lg font-bold text-gray-900">{e.count}</p>
                    <p className="text-xs text-gray-500">
                      {Math.round((e.count / data.total) * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
