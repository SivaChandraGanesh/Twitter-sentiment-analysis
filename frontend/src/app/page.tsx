"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useWebSocket } from "@/lib/useWebSocket";
import { startStream, stopStream, resetStream } from "@/lib/api";
import axios from "axios";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import type { LiveRecord } from "@/lib/useWebSocket";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: "#22c55e", Neutral: "#94a3b8", Negative: "#ef4444",
};
const EMOTION_COLORS = ["#3b82f6", "#fbbf24", "#ef4444", "#a855f7", "#22c55e", "#f97316"];

type TimePoint = { time: string; Positive: number; Negative: number; Neutral: number };

type DbStats = {
  total_records: number;
  positive: number;
  negative: number;
  neutral: number;
  dominant_emotion: string;
};

type VizData = {
  sentiment_distribution: Record<string, number>;
  emotion_distribution: Record<string, number>;
  total: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const { connected, streamRunning, stats, records, latestRecord } = useWebSocket();
  const [timeData, setTimeData] = useState<TimePoint[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [dbViz, setDbViz] = useState<VizData | null>(null);

  const fetchDbData = async () => {
    try {
      const [summaryRes, vizRes] = await Promise.all([
        axios.get<DbStats>(`${API_BASE}/api/dashboard/summary`),
        axios.get<VizData>(`${API_BASE}/api/dashboard`),
      ]);
      setDbStats(summaryRes.data);
      setDbViz(vizRes.data);
    } catch { /* backend may not be ready yet */ }
  };

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") !== "true") router.push("/login");
    else { setIsAuth(true); fetchDbData(); }
  }, [router]);

  // Build rolling 60-second time series from incoming records
  useEffect(() => {
    if (!latestRecord) return;
    const now = new Date();
    const label = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setTimeData((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last && last.time === label) {
        return next; // same second, skip
      }
      const point: TimePoint = {
        time: label,
        Positive: stats.sentiment.Positive || 0,
        Negative: stats.sentiment.Negative || 0,
        Neutral: stats.sentiment.Neutral || 0,
      };
      return [...next, point].slice(-30); // keep last 30 points
    });
  }, [latestRecord, stats]);

  const handleStart = async () => {
    setActionLoading(true);
    await startStream(2.0).catch(() => null);
    setActionLoading(false);
  };

  const handleStop = async () => {
    setActionLoading(true);
    await stopStream().catch(() => null);
    setActionLoading(false);
  };

  const handleReset = async () => {
    setActionLoading(true);
    await resetStream().catch(() => null);
    await fetchDbData(); // Refresh to show 0s
    setTimeData([]);     // Clear trend line
    setActionLoading(false);
  };

  if (!isAuth) return null;

  // Prefer live WebSocket data when the stream is running; fall back to DB data
  const liveTotal = stats.total;
  const total = liveTotal > 0 ? liveTotal : (dbStats?.total_records ?? 0);

  // Merge: use live ws emotion if available, else DB viz emotion data
  const emotionSource: Record<string, number> =
    Object.keys(stats.emotion).length > 0
      ? stats.emotion
      : dbViz?.emotion_distribution ?? {};

  const sentimentSource: Record<string, number> =
    liveTotal > 0
      ? stats.sentiment
      : dbViz?.sentiment_distribution ?? {};

  const sentimentPie = Object.entries(sentimentSource)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const positivePct = total > 0
    ? Math.round(((sentimentSource.Positive || 0) / total) * 100)
    : 0;
  const negativePct = total > 0
    ? Math.round(((sentimentSource.Negative || 0) / total) * 100)
    : 0;
  const neutralPct = total > 0
    ? Math.round(((sentimentSource.Neutral || 0) / total) * 100)
    : 0;

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <Header title="Live Dashboard" subtitle="Real-time sentiment & emotion analytics. Stream updates automatically." />
      <div className="flex-1 p-6">
        {/* Stream controls + Connection Status */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${connected ? (streamRunning ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")
              : "bg-red-100 text-red-600"
              }`}>
              <span className={`h-2 w-2 rounded-full ${connected ? (streamRunning ? "bg-green-500 animate-pulse" : "bg-yellow-400") : "bg-red-500"
                }`} />
              {connected ? (streamRunning ? "LIVE" : "PAUSED") : "DISCONNECTED"}
            </span>
            <span className="text-xs text-gray-500">{total.toLocaleString()} records analyzed</span>
            {dbStats && liveTotal === 0 && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                📁 Dataset loaded
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} disabled={actionLoading || streamRunning}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              🔄 Reset
            </button>
            {streamRunning ? (
              <button onClick={handleStop} disabled={actionLoading}
                className="rounded-lg bg-red-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-60">
                ⏹ Stop Stream
              </button>
            ) : (
              <button onClick={handleStart} disabled={actionLoading}
                className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60">
                ▶ Start Live Stream
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-2 text-2xl">💾</div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Analyzed</p>
            <p className={`mt-1 text-3xl font-bold text-gray-900 ${streamRunning ? "transition-all duration-300" : ""}`}>
              {total.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-2 text-2xl">😊</div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Positive</p>
            <p className="mt-1 text-3xl font-bold text-green-600">{positivePct}%</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-2 text-2xl">😞</div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Negative</p>
            <p className="mt-1 text-3xl font-bold text-red-500">{negativePct}%</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-2 text-2xl">😐</div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Neutral</p>
            <p className="mt-1 text-3xl font-bold text-gray-600">{neutralPct}%</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sentiment Pie */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Sentiment Distribution</h3>
            <div className="relative h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {sentimentPie.map((entry) => (
                      <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name] ?? "#6366f1"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-2xl font-bold text-blue-600">{positivePct}%</p>
                <p className="text-xs text-gray-400 font-semibold">POS</p>
              </div>
            </div>
          </div>

          {/* Emotion Breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Live Emotion Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(emotionSource).map(([emo, count], i) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={emo}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700">{emo}</span>
                      <span className="font-semibold text-gray-900">{count} ({pct}%)</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: EMOTION_COLORS[i % EMOTION_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
              {Object.keys(emotionSource).length === 0 && (
                <p className="text-sm text-gray-400">Start the stream or upload a CSV to see emotions.</p>
              )}
            </div>
          </div>

          {/* Latest Record Feed */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Live Feed</h3>
            <div className="h-52 overflow-y-auto space-y-2 scrollbar-thin">
              {records.slice(0, 20).map((r, i) => (
                <div key={`${r.id}-${i}`}
                  className={`rounded-lg border p-2 text-xs transition-all ${r.sentiment === "Positive" ? "border-green-200 bg-green-50"
                    : r.sentiment === "Negative" ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-gray-50"
                    }`}>
                  <p className="line-clamp-2 text-gray-700">{r.text}</p>
                  <div className="mt-1 flex gap-2">
                    <span className={`font-bold ${r.sentiment === "Positive" ? "text-green-600" : r.sentiment === "Negative" ? "text-red-600" : "text-gray-500"}`}>
                      {r.sentiment}
                    </span>
                    <span className="text-gray-400">· {r.emotion} · {Math.round(r.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
              {records.length === 0 && (
                <p className="text-sm text-gray-400">Stream will appear here in real time.</p>
              )}
            </div>
          </div>
        </div>

        {/* Live Trend Line */}
        {timeData.length > 1 && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Sentiment Trend (Live)</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Positive" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                  <Area type="monotone" dataKey="Neutral" stackId="1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.5} />
                  <Area type="monotone" dataKey="Negative" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
