"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { getCsvExportUrl, getPdfExportUrl, getInsightsSummary } from "@/lib/api";
import {
  BarChart, Bar, Cell, LineChart, Line, Area,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";

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
    executive: true, sentiment: true, emotion: true, wordcloud: false, timeline: true,
  });

  const [emotionBreakdown, setEmotionBreakdown] = useState([
    { emotion: "Joy", value: 45, color: "#3b82f6" },
    { emotion: "Trust", value: 30, color: "#60a5fa" },
    { emotion: "Surprise", value: 15, color: "#93c5fd" },
    { emotion: "Fear", value: 5, color: "#cbd5e1" },
    { emotion: "Anger", value: 5, color: "#ef4444" },
  ]);

  useEffect(() => {
    getInsightsSummary()
      .then((res) => {
        const counts = (res as { counts?: { emotion?: Record<string, number> } }).counts;
        if (counts?.emotion) {
          const colors = ["#3b82f6", "#60a5fa", "#22c55e", "#a855f7", "#ef4444", "#f97316"];
          setEmotionBreakdown(
            Object.entries(counts.emotion).map(([e, v], i) => ({
              emotion: e, value: v, color: colors[i % colors.length],
            }))
          );
        }
      })
      .catch(() => null);
  }, []);

  return (
    <div className="flex flex-col bg-white">
      <Header
        title="Analysis Report"
        breadcrumbs={["Reports"]}
        subtitle="Full sentiment & emotion report with CSV and PDF export."
      />

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-80 border-r border-gray-200 bg-white p-6">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Configuration</h2>
          <p className="mb-6 text-sm text-gray-500">Customize report components.</p>

          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-gray-700">Included Sections</label>
            <div className="space-y-3">
              {[
                { id: "executive", label: "Executive Summary", desc: "Overview KPIs & Goals" },
                { id: "sentiment", label: "Overall Sentiment", desc: "Polarity & Subjectivity" },
                { id: "emotion", label: "Emotion Distribution", desc: "Joy, Fear, Anger breakdown" },
                { id: "wordcloud", label: "Word Clouds", desc: "Common thematic terms" },
                { id: "timeline", label: "Timeline Analysis", desc: "Sentiment over 30 days" },
              ].map((section) => (
                <label key={section.id} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={sections[section.id as keyof typeof sections]}
                    onChange={(e) => setSections((prev) => ({ ...prev, [section.id]: e.target.checked }))}
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
        </aside>

        {/* Main Content — Report Preview */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
            {/* Report Header */}
            <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">DDE ANALYTICS</p>
                <h1 className="mt-1 text-3xl font-bold text-gray-900">Sentiment Distribution Analysis</h1>
                <p className="mt-1 text-sm text-gray-600">Data Driven Emotion — Auto Report</p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  LIVE REPORT
                </span>
                <div className="mt-2 flex gap-2">
                  <a href={getCsvExportUrl()} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    CSV
                  </a>
                  <a href={getCsvExportUrl()} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    Excel
                  </a>
                  <a href={getPdfExportUrl()} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                    Download PDF
                  </a>
                </div>
              </div>
            </div>

            {/* Emotion Breakdown Chart */}
            {sections.emotion && (
              <div className="mb-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">II. EMOTION BREAKDOWN</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emotionBreakdown} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="emotion" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {emotionBreakdown.map((entry, index) => (
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
                      <Area type="monotone" dataKey="score" stroke="#60a5fa" fill="#dbeafe" fillOpacity={0.6} />
                      <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-xs text-gray-500">OCT 1 – OCT 24</p>
              </div>
            )}

            {/* Key Insights Table */}
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">KEY INSIGHTS TABLE</h2>
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
                        <span className={`font-medium ${row.impactColor === "green" ? "text-green-600"
                            : row.impactColor === "red" ? "text-red-600"
                              : "text-gray-600"
                          }`}>
                          {row.impact}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.volume}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-500">
              <span>Page 1 of 1</span>
              <span>Generated by Data Driven Emotion Engine v2.0</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
