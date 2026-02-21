"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const SENTIMENT_DATA = [
  { name: "Positive", value: 64, color: "#3b82f6" },
  { name: "Neutral", value: 18, color: "#94a3b8" },
  { name: "Negative", value: 18, color: "#ef4444" },
];

const EMOTION_DATA = [
  { emotion: "Joy", value: 80, color: "#fbbf24" },
  { emotion: "Sadness", value: 35, color: "#94a3b8" },
];

const RECENT_ACTIVITY = [
  {
    icon: "📊",
    name: "Feedback_Q4_v2.csv",
    status: "Analysis completed successfully",
    badge: "STABLE",
    badgeColor: "green",
    time: "2 mins ago",
  },
  {
    icon: "⭐",
    name: "Twitter API Stream",
    status: "Real-time keyword tracking active",
    badge: "LIVE",
    badgeColor: "blue",
    time: "14 mins ago",
  },
  {
    icon: "📥",
    name: "Monthly_Report_Oct.pdf",
    status: "Report generation request",
    badge: "PENDING",
    badgeColor: "orange",
    time: "1 hour ago",
  },
  {
    icon: "📊",
    name: "User_Interviews_Transcript.txt",
    status: "Sentiment processing complete",
    badge: "SUCCESS",
    badgeColor: "green",
    time: "3 hours ago",
  },
];

export default function Dashboard() {
  return (
    <div className="flex flex-col bg-white">
      <Header
        title="Dashboard Overview"
        subtitle="Real-time sentiment and emotion analytics for your data stream."
      />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div></div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <span>📅</span> Last 30 Days
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <span>📤</span> Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="absolute right-4 top-4 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              +12%
            </div>
            <div className="mb-2 text-2xl">💾</div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Total Records
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">12,450</p>
          </div>
          <div className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="absolute right-4 top-4 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              +5%
            </div>
            <div className="mb-2 text-2xl">😊</div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Positive%
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">64%</p>
          </div>
          <div className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="absolute right-4 top-4 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              -2%
            </div>
            <div className="mb-2 text-2xl">😞</div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Negative%
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">18%</p>
          </div>
          <div className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="absolute right-4 top-4 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
              -3%
            </div>
            <div className="mb-2 text-2xl">😐</div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Neutral%
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">18%</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sentiment Distribution */}
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Sentiment Distribution
            </h3>
            <div className="mb-4 flex gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Positive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <span className="text-sm text-gray-600">Neutral</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Negative</span>
              </div>
            </div>
            <div className="relative h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SENTIMENT_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {SENTIMENT_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-3xl font-bold text-blue-600">64%</p>
                <p className="text-sm text-blue-600">GROWTH</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h3>
            <div className="space-y-4">
              {RECENT_ACTIVITY.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xl">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{activity.status}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                          activity.badgeColor === "green"
                            ? "bg-green-100 text-green-700"
                            : activity.badgeColor === "blue"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {activity.badge}
                      </span>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emotional Breakdown */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Emotional Breakdown</h3>
          <div className="space-y-4">
            {EMOTION_DATA.map((item, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{item.emotion}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
