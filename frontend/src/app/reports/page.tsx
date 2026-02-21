"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

const EMOTION_BREAKDOWN = [
  { emotion: "Joy", value: 45, color: "#3b82f6" },
  { emotion: "Trust", value: 30, color: "#3b82f6" },
  { emotion: "Surprise", value: 15, color: "#60a5fa" },
  { emotion: "Fear", value: 5, color: "#cbd5e1" },
  { emotion: "Anger", value: 5, color: "#ef4444" },
];

const TIMELINE_DATA = Array.from({ length: 24 }, (_, i) => ({
  date: `Oct ${i + 1}`,
  score: Math.floor(Math.random() * 30) + 60,
}));

const INSIGHTS_TABLE = [
  { attribute: "User Experience", impact: "High Positive", impactColor: "green", volume: "2,491 items" },
  { attribute: "Subscription Pricing", impact: "Neutral", impactColor: "gray", volume: "1,102 items" },
  { attribute: "Mobile App Stability", impact: "Negative", impactColor: "red", volume: "843 items" },
];

export default function ReportsPage() {
  const [sections, setSections] = useState({
    executive: true,
    sentiment: true,
    emotion: true,
    wordcloud: false,
    timeline: true,
  });

  return (
    <div className="flex flex-col bg-white">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Data Driven Emotion</h1>
          </div>
          <nav className="flex gap-6 text-sm font-medium text-gray-600">
            {["Dashboard", "Analytics", "Reports", "Settings"].map((item) => (
              <a
                key={item}
                href="#"
                className={item === "Reports" ? "text-blue-600 underline" : "hover:text-gray-900"}
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search reports..."
                className="rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">🔔</button>
            <div className="h-8 w-8 rounded-full bg-gray-200"></div>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar - Configuration */}
        <aside className="w-80 border-r border-gray-200 bg-white p-6">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Configuration</h2>
          <p className="mb-6 text-sm text-gray-500">Customize report components.</p>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Source Dataset
            </label>
            <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option>Q4 Customer Feedback 2023</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Included Sections
            </label>
            <div className="space-y-3">
              {[
                { id: "executive", label: "Executive Summary", desc: "Overview KPIs & Goals" },
                { id: "sentiment", label: "Overall Sentiment", desc: "Polarity & Subjectivity" },
                { id: "emotion", label: "Emotion Distribution", desc: "Joy, Fear, Anger breakdown" },
                { id: "wordcloud", label: "Word Clouds", desc: "Common thematic terms" },
                { id: "timeline", label: "Timeline Analysis", desc: "Sentiment over 30 days" },
              ].map((section) => (
                <label
                  key={section.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={sections[section.id as keyof typeof sections]}
                    onChange={(e) =>
                      setSections((prev) => ({
                        ...prev,
                        [section.id]: e.target.checked,
                      }))
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{section.label}</p>
                    <p className="text-xs text-gray-500">{section.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Metadata</p>
            <div className="space-y-2 text-xs text-gray-600">
              <p>
                <span className="font-medium">Generated By:</span> Sarah Jenkins (Data Scientist)
              </p>
              <p>
                <span className="font-medium">Date Generated:</span> October 24, 2023 - 14:32
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content - Report Preview */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
            {/* Report Header */}
            <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">DDE ANALYTICS</p>
                <h1 className="mt-1 text-3xl font-bold text-gray-900">
                  Sentiment Distribution Analysis
                </h1>
                <p className="mt-1 text-sm text-gray-600">Report: Q4 Customer Feedback 2023</p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  LIVE DRAFT
                </span>
                <div className="mt-2 flex gap-2">
                  <button className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    CSV
                  </button>
                  <button className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    Excel
                  </button>
                  <button className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                    Download PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="text-right text-xs text-gray-500">
              REF: #REP-2023-1024 • SEC: INTERNAL USE ONLY
            </div>

            {/* KPI Cards */}
            <div className="my-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">NET SENTIMENT</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-3xl font-bold text-blue-600">+68.4</p>
                  <span className="text-green-600">↑</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">+12% from previous month</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">PRIMARY EMOTION</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-2xl">😄</span>
                  <p className="text-2xl font-bold text-gray-900">Joy</p>
                </div>
                <p className="mt-1 text-xs text-gray-600">Present in 42% of responses</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">CONFIDENCE LEVEL</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">94.2%</p>
                <p className="mt-1 text-xs text-gray-600">High statistical significance</p>
              </div>
            </div>

            {/* Emotion Breakdown */}
            {sections.emotion && (
              <div className="mb-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">II. EMOTION BREAKDOWN</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={EMOTION_BREAKDOWN} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="emotion" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {EMOTION_BREAKDOWN.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Timeline Analysis */}
            {sections.timeline && (
              <div className="mb-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">TIMELINE ANALYSIS</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={TIMELINE_DATA}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#60a5fa"
                        fill="#dbeafe"
                        fillOpacity={0.6}
                      />
                      <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-xs text-gray-500">OCT 1 - OCT 24, 2023</p>
              </div>
            )}

            {/* Key Insights Table */}
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">KEY INSIGHTS TABLE</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium text-gray-700">ATTRIBUTE</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">IMPACT</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">VOLUME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INSIGHTS_TABLE.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.attribute}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-medium ${
                              row.impactColor === "green"
                                ? "text-green-600"
                                : row.impactColor === "red"
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            {row.impact}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{row.volume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-500">
              <span>Page 1 of 4</span>
              <span>Generated by Data Driven Emotion Engine v2.4.1</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
