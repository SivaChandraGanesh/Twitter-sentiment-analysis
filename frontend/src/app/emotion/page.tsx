"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const EMOTIONS = [
  { name: "JOY", emoji: "😄", percentage: 68, color: "#fbbf24" },
  { name: "ANGER", emoji: "😠", percentage: 5, color: "#ef4444" },
  { name: "SADNESS", emoji: "😢", percentage: 12, color: "#3b82f6" },
  { name: "FEAR", emoji: "😨", percentage: 3, color: "#a855f7" },
  { name: "SURPRISE", emoji: "😲", percentage: 12, color: "#22c55e" },
];

const FREQUENCY_DATA = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  volume: Math.floor(Math.random() * 500) + 200,
}));

export default function EmotionPage() {
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d">("24h");

  return (
    <div className="flex flex-col bg-white">
      <Header
        title="Emotion Detection Analytics"
        subtitle="REAL-TIME STREAM: ACTIVE"
      />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search analytics..."
              className="rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="absolute left-3 text-gray-400">🔍</span>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <span>📥</span> Export Report
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current Dominant State */}
          <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="absolute right-4 top-4 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              Live
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              CURRENT DOMINANT STATE
            </p>
            <div className="mb-4 flex items-center gap-4">
              <div className="text-5xl">😄</div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Joy Detected</h3>
                <p className="mt-1 text-sm text-gray-600">
                  User sentiment is highly positive. Trending upward by 5.4% compared to the
                  previous 60-minute interval.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
              <div>
                <p className="text-xs text-gray-500">CONFIDENCE SCORE</p>
                <p className="text-xl font-bold text-gray-900">68.2%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">INTENSITY LEVEL</p>
                <p className="text-xl font-bold text-gray-900">High</p>
              </div>
            </div>
            <a href="#" className="mt-4 block text-sm font-medium text-blue-600 hover:underline">
              View deeper breakdown →
            </a>
          </div>

          {/* Total Samples */}
          <div className="rounded-xl border border-gray-200 bg-blue-600 p-6 text-white shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-100">
              TOTAL SAMPLES
            </p>
            <p className="mb-4 text-4xl font-bold">12,842</p>
            <p className="mb-4 text-sm text-blue-100">Analysed in last 24h</p>
            <div className="border-t border-blue-500 pt-4">
              <p className="mb-1 text-xs text-blue-100">PEAK EMOTION</p>
              <p className="flex items-center gap-2 text-lg font-semibold">
                Surprise at 14:02
                <span>📈</span>
              </p>
            </div>
          </div>
        </div>

        {/* Emotional Distribution */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Emotional Distribution</h3>
            <div className="flex gap-2">
              {(["24h", "7d", "30d"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeFilter(period)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium ${
                    timeFilter === period
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-5">
            {EMOTIONS.map((emotion) => (
              <div key={emotion.name} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-2 text-3xl">{emotion.emoji}</div>
                <p className="mb-1 text-xs font-semibold text-gray-700">{emotion.name}</p>
                <p className="mb-2 text-lg font-bold text-gray-900">{emotion.percentage}%</p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${emotion.percentage}%`,
                      backgroundColor: emotion.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detection Frequency */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Detection Frequency</h3>
          <p className="mb-4 text-sm text-gray-600">
            Hourly volume of emotional data points detected
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FREQUENCY_DATA}>
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-end">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              Total Volume
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
