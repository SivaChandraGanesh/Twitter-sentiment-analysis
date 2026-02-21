"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useWebSocket } from "@/lib/useWebSocket";
import { getDashboardData } from "@/lib/api";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area,
} from "recharts";
import type { LiveRecord } from "@/lib/useWebSocket";

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: "#22c55e", Neutral: "#94a3b8", Negative: "#ef4444",
};
const EMOTION_COLORS = ["#fbbf24", "#ef4444", "#3b82f6", "#a855f7", "#22c55e", "#f97316", "#06b6d4", "#84cc16"];

type TimePoint = { time: string; Positive: number; Negative: number; Neutral: number };

export default function VisualizationsPage() {
  const { streamRunning, stats, records, latestRecord } = useWebSocket();
  const [timeData, setTimeData] = useState<TimePoint[]>([]);
  const [dbViz, setDbViz] = useState<any>(null);

  useEffect(() => {
    getDashboardData().then(setDbViz).catch(() => null);
  }, []);

  // Build rolling time series from stats updates
  useEffect(() => {
    if (!latestRecord) return;
    const now = new Date();
    const label = now.toLocaleTimeString("en-GB", { hour12: false });
    setTimeData((prev) => {
      const point: TimePoint = {
        time: label,
        Positive: stats.sentiment.Positive || 0,
        Negative: stats.sentiment.Negative || 0,
        Neutral: stats.sentiment.Neutral || 0,
      };
      // Deduplicate same-second updates
      if (prev.length && prev[prev.length - 1].time === label) {
        return [...prev.slice(0, -1), point];
      }
      return [...prev, point].slice(-40); // keep last 40 points
    });
  }, [latestRecord, stats]);

  // Merge stats: Use live data if stream is running, else fallback to DB data
  const total = streamRunning || stats.total > 0 ? stats.total : (dbViz?.total ?? 0);

  const sentimentSource = streamRunning || stats.total > 0
    ? stats.sentiment
    : (dbViz?.sentiment_distribution ?? {});

  const emotionSource = streamRunning || stats.total > 0
    ? stats.emotion
    : (dbViz?.emotion_distribution ?? {});

  const sentimentPie = Object.entries(sentimentSource)
    .filter(([, v]) => (v as number) > 0)
    .map(([name, value]) => ({ name, value }));

  const emotionBar = Object.entries(emotionSource).map(([name, count], i) => ({
    name, count: count as number, color: EMOTION_COLORS[i % EMOTION_COLORS.length],
  }));

  // Word "frequency" approximation from records + DB preview logic
  const wordFreq: Record<string, number> = {};
  records.slice(0, 100).forEach((r) => {
    (r.clean_text || r.text || "").split(/\s+/).forEach((w) => {
      if (w.length > 3) wordFreq[w] = (wordFreq[w] || 0) + 1;
    });
  });
  const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <Header
        title="Live Visualizations"
        breadcrumbs={["Analytics", "Charts"]}
        subtitle="All charts update automatically as new data streams in. No refresh needed."
      />
      <div className="flex-1 p-6 space-y-6">
        {/* Connection badge */}
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${streamRunning ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
            <span className={`h-2 w-2 rounded-full ${streamRunning ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
            {streamRunning ? "LIVE — Charts morphing every ~2 seconds" : "Stream paused"}
          </span>
          <span className="text-xs text-gray-500">{total.toLocaleString()} total records</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sentiment Donut */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Sentiment Distribution</h3>
            {sentimentPie.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-gray-400">Start the stream to see data</div>
            ) : (
              <div className="relative h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sentimentPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                      {sentimentPie.map((entry) => (
                        <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name] ?? "#6366f1"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">records</p>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-center gap-6">
              {sentimentPie.map(e => (
                <div key={e.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS[e.name] }} />
                  <span className="text-gray-600">{e.name}</span>
                  <span className="font-semibold text-gray-900">{total > 0 ? Math.round(((e.value as number) / total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emotion Bar Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Emotion Breakdown</h3>
            {emotionBar.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-gray-400">Start the stream to see data</div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emotionBar} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {emotionBar.map((e, i) => <Cell key={e.name} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Live Trend (area chart) */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Sentiment Trend Over Time (Live)</h3>
          {timeData.length < 2 ? (
            <div className="flex h-48 items-center justify-center text-gray-400">
              Trend will appear after a few seconds of streaming.
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="time" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Positive" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Neutral" stackId="1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.5} />
                  <Area type="monotone" dataKey="Negative" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Keywords */}
        {topWords.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Top Keywords (from live stream)</h3>
            <div className="flex flex-wrap gap-2">
              {topWords.map(({ word, count }, i) => (
                <span key={word} style={{ fontSize: `${Math.max(12, 12 + count)}px` }}
                  className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                  {word} <span className="text-blue-400 text-xs">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
