"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { getDashboardData } from "@/lib/api";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Area,
  XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid,
} from "recharts";

const COLORS = ["#22c55e", "#94a3b8", "#ef4444", "#3b82f6", "#f97316", "#a855f7"];

export default function VisualizationsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    sentiment_distribution: Record<string, number>;
    emotion_distribution: Record<string, number>;
    sentiment_over_time: any[];
    top_words: any[];
    total: number;
  } | null>(null);

  useEffect(() => {
    fetchVizData();
  }, []);

  const fetchVizData = async () => {
    try {
      const res = await getDashboardData();
      setData(res as any);
    } catch (e) {
      console.error("Failed to fetch visualization data", e);
    } finally {
      setLoading(false);
    }
  };

  const sentimentPie = data ? Object.entries(data.sentiment_distribution).map(([name, value]) => ({ name, value })) : [];
  const emotionBar = data ? Object.entries(data.emotion_distribution).map(([emotion, value], i) => ({
    emotion, value, color: COLORS[(i + 3) % COLORS.length]
  })) : [];

  return (
    <div className="flex flex-col bg-white">
      <Header
        title="Visualizations"
        breadcrumbs={["Analytics", "Visualizations"]}
        subtitle="Full analytical view of your sentiment and emotion trends."
      />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div />
          <button
            onClick={fetchVizData}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <span>🔄</span> Refresh Data
          </button>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">Total Samples</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{data?.total.toLocaleString() || "0"}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">Sentiment Groups</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{sentimentPie.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">Data Status</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${loading ? "bg-orange-500" : "bg-green-500"}`}></span>
              <p className="text-sm font-semibold text-gray-900">{loading ? "Updating..." : "Live Sync"}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sentiment Distribution */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Sentiment Distribution</h3>
            <div className="relative h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentPie}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    dataKey="value"
                  >
                    {sentimentPie.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-xs font-bold text-gray-400">DISTRIBUTION</p>
                <p className="text-2xl font-bold text-blue-600">Polarity</p>
              </div>
            </div>
          </div>

          {/* Emotion Breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Emotion Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emotionBar} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="emotion" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {emotionBar.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sentiment Trends */}
        {data && data.sentiment_over_time.length > 0 && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Sentiment Trends Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.sentiment_over_time}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Positive" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Neutral" stackId="1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Negative" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Word Cloud / Top Terms */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Keyword Prominence</h3>
          <div className="flex flex-wrap gap-3">
            {data?.top_words.map((kw, i) => (
              <span
                key={i}
                className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700 font-medium"
                style={{ fontSize: `${Math.min(32, 10 + kw.count * 2)}px` }}
              >
                {kw.word}
              </span>
            ))}
            {data?.top_words.length === 0 && <p className="text-sm text-gray-400">Process data to see keywords.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to make AreaChart work with standard import
import { AreaChart } from "recharts";
