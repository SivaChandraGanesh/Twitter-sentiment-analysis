"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { getInsightsSummary } from "@/lib/api";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";

const COLORS = ["#3b82f6", "#94a3b8", "#ef4444", "#fbbf24", "#8b5cf6", "#f97316"];

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    total: number;
    sentiment: Record<string, number>;
    emotion: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem("isLoggedIn");
    if (auth !== "true") {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
      fetchStats();
    }
  }, [router]);

  const fetchStats = async () => {
    try {
      const res = await getInsightsSummary();
      if (res && res.counts) {
        // Parse the summary text to get a better 'total' if available, or use counts
        const total = Object.values(res.counts.sentiment || {}).reduce((a, b) => a + b, 0);
        setData({
          total,
          sentiment: res.counts.sentiment || {},
          emotion: res.counts.emotion || {},
        });
      }
    } catch (e) {
      console.error("Failed to fetch dashboard stats", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  const sentimentPie = data ? Object.entries(data.sentiment).map(([name, value]) => ({ name, value })) : [];
  const positivePct = data && data.total > 0 ? Math.round(((data.sentiment["Positive"] || 0) / data.total) * 100) : 0;
  const negativePct = data && data.total > 0 ? Math.round(((data.sentiment["Negative"] || 0) / data.total) * 100) : 0;
  const neutralPct = data && data.total > 0 ? Math.round(((data.sentiment["Neutral"] || 0) / data.total) * 100) : 0;

  return (
    <div className="flex flex-col bg-white">
      <Header
        title="Dashboard Overview"
        subtitle="Real-time sentiment and emotion analytics for your data stream."
      />
      <div className="flex-1 p-6">
        {/* KPI Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Records", val: data?.total.toLocaleString() || "0", icon: "💾" },
            { label: "Positive%", val: `${positivePct}%`, icon: "😊", color: "green" },
            { label: "Negative%", val: `${negativePct}%`, icon: "😞", color: "red" },
            { label: "Neutral%", val: `${neutralPct}%`, icon: "😐", color: "gray" },
          ].map((kpi) => (
            <div key={kpi.label} className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-2 text-2xl">{kpi.icon}</div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{kpi.label}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{loading ? "..." : kpi.val}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sentiment Distribution */}
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Sentiment Distribution</h3>
            <div className="flex gap-4 mb-4">
              {sentimentPie.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
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
                <p className="text-3xl font-bold text-blue-600">{positivePct}%</p>
                <p className="text-xs text-blue-600 font-bold">POSITIVE</p>
              </div>
            </div>
          </div>

          {/* Recent Activity (Mocked for now as we don't have an activity log in DB) */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🟢</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Backend API</p>
                  <p className="text-xs text-gray-500">Operational & Healthy</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">🗄️</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">SQLite Database</p>
                  <p className="text-xs text-gray-500">Connected & Synced</p>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t pt-4">
              <p className="text-xs text-gray-500">Your analysis session is active. All data processed in real-time.</p>
            </div>
          </div>
        </div>

        {/* Emotional Breakdown */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Emotional Breakdown</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {data && Object.entries(data.emotion).map(([emotion, count], i) => (
              <div key={emotion}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{emotion}</span>
                  <span className="text-sm font-semibold text-gray-900">{Math.round((count / data.total) * 100)}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((count / data.total) * 100)}%`,
                      backgroundColor: COLORS[(i + 3) % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
            {(!data || Object.keys(data.emotion).length === 0) && (
              <p className="text-sm text-gray-400">No emotional data sampled yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
