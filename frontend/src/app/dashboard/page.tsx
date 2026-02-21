"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const SENTIMENT_PIE = [
  { name: "Positive", value: 62, color: "#22c55e" },
  { name: "Neutral", value: 28, color: "#94a3b8" },
  { name: "Negative", value: 10, color: "#ef4444" },
];

const EMOTION_BAR = [
  { emotion: "Joy", value: 45, color: "#3b82f6" },
  { emotion: "Surprise", value: 22, color: "#60a5fa" },
  { emotion: "Sadness", value: 15, color: "#94a3b8" },
  { emotion: "Anger", value: 10, color: "#ef4444" },
  { emotion: "Fear", value: 8, color: "#a855f7" },
];

const TREND_DATA = [
  { date: "SEP 15", current: 45, previous: 40 },
  { date: "SEP 22", current: 52, previous: 48 },
  { date: "SEP 29", current: 58, previous: 55 },
  { date: "OCT 06", current: 65, previous: 60 },
  { date: "OCT 13", current: 72, previous: 68 },
  { date: "OCT 20", current: 78, previous: 75 },
  { date: "OCT 27", current: 82, previous: 80 },
];

const KEYWORDS = [
  { word: "Customer", size: 24 },
  { word: "Service", size: 22 },
  { word: "Interface", size: 20 },
  { word: "Fast", size: 18 },
  { word: "Shipping", size: 16 },
  { word: "Reliability", size: 16 },
  { word: "Support", size: 14 },
  { word: "Quality", size: 14 },
  { word: "Price", size: 12 },
  { word: "Amazing", size: 12 },
  { word: "UX Design", size: 10 },
  { word: "Feedback", size: 10 },
  { word: "Mobile", size: 8 },
  { word: "Love", size: 8 },
  { word: "Efficient", size: 8 },
];

const INSIGHTS = [
  {
    type: "info",
    icon: "💡",
    title: "Positive shift in 'Ease of Use'",
    desc: "Users are mentioning the new navigation 34% more positively since Oct 1st.",
  },
  {
    type: "warning",
    icon: "⚠️",
    title: "Potential friction in 'Checkout'",
    desc: "Sentiment has dipped slightly (4%) in Twitter mentions regarding mobile payments.",
  },
  {
    type: "success",
    icon: "✓",
    title: "Success: 'Surprise' emotion spike",
    desc: "A recent localized marketing campaign triggered high positive surprise in the US region.",
  },
];

export default function VisualizationsPage() {
  return (
    <div className="flex flex-col bg-white">
      <Header
        title="Visualizations"
        breadcrumbs={["Analytics", "Visualizations"]}
        subtitle="Real-time sentiment and emotion analysis across all integrated data sources."
      />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <span>📁</span> All Sources
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <span>📅</span> Last 30 Days
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <span>🔍</span> Advanced Filters
            </button>
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <span>🔄</span> Refresh Data
          </button>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">Overall Sentiment</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">74%</p>
            <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              +12%
            </span>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">Total Mentions</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">12.4k</p>
            <p className="mt-1 text-xs text-gray-500">vs 11k last mo.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">Dominant Emotion</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl">😄</span>
              <p className="text-xl font-bold text-gray-900">Joy</p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">Data Freshness</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              <p className="text-sm font-semibold text-gray-900">Live</p>
            </div>
            <p className="mt-1 text-xs text-gray-500">Updated 2m ago</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sentiment Distribution */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Sentiment Distribution</h3>
              <span className="text-gray-400">ℹ️</span>
            </div>
            <div className="relative h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SENTIMENT_PIE}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {SENTIMENT_PIE.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-2xl font-bold text-blue-600">Net Score</p>
                <p className="text-3xl font-bold text-blue-600">+42</p>
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Positive 62%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <span className="text-sm text-gray-600">Neutral 28%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Negative 10%</span>
              </div>
            </div>
          </div>

          {/* Emotion Breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Emotion Breakdown</h3>
              <div className="flex gap-2">
                <span className="text-gray-400">📊</span>
                <span className="text-gray-400">📋</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={EMOTION_BAR} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="emotion" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {EMOTION_BAR.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sentiment Trends */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Sentiment Trends Over Time
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Analysis of daily sentiment score fluctuations
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Current Period"
                />
                <Line
                  type="monotone"
                  dataKey="previous"
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  name="Previous Period"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Keyword Prominence */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Keyword Prominence</h3>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                View All Terms
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              {KEYWORDS.map((kw, i) => (
                <span
                  key={i}
                  className="rounded bg-gray-100 px-2 py-1 text-gray-700"
                  style={{ fontSize: `${kw.size}px` }}
                >
                  {kw.word}
                </span>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
              <p className="text-sm font-medium text-green-600">
                TOP GROWTH: "Efficiency" +22%
              </p>
              <p className="text-sm font-medium text-red-600">
                DECLINING: "Wait-time" -12%
              </p>
            </div>
          </div>

          {/* AI Generated Insights */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">AI Generated Insights</h3>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                New
              </span>
            </div>
            <div className="space-y-3">
              {INSIGHTS.map((insight, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 ${
                    insight.type === "info"
                      ? "border-blue-200 bg-blue-50"
                      : insight.type === "warning"
                      ? "border-orange-200 bg-orange-50"
                      : "border-green-200 bg-green-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{insight.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{insight.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{insight.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Generate Custom Summary
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
          © 2024 Data Driven Emotion. All analytical data is processed securely.
        </div>
      </div>
    </div>
  );
}
