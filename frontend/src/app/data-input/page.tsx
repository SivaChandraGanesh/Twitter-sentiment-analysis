"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useWebSocket } from "@/lib/useWebSocket";
import { startStream, stopStream, resetStream, analyzeSingleTweet } from "@/lib/api";
import type { SentimentResponse } from "@/lib/types";

const SPEED_OPTIONS = [
  { label: "⚡ Fast (1s)", value: 1.0 },
  { label: "🔥 Normal (2s)", value: 2.0 },
  { label: "🐢 Slow (4s)", value: 4.0 },
];

const SENTIMENT_COLOR: Record<string, string> = {
  Positive: "text-green-600", Negative: "text-red-500", Neutral: "text-gray-500",
};

export default function DataInputPage() {
  const { connected, streamRunning, stats, records } = useWebSocket();
  const [speed, setSpeed] = useState(2.0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"live" | "upload" | "text">("live");
  const [file, setFile] = useState<File | null>(null);
  const [singleText, setSingleText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<SentimentResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    await startStream(speed).catch(() => null);
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    await stopStream().catch(() => null);
    setLoading(false);
  };

  const handleReset = async () => {
    setLoading(true);
    await resetStream().catch(() => null);
    setLoading(false);
  };

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <Header
        title="Live Data Control"
        breadcrumbs={["Data", "Control"]}
        subtitle="Control the real-time analysis stream and see live results below."
      />
      <div className="flex-1 p-6">
        {/* Tab Bar */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          {[
            { id: "live", label: "🔴 Live Stream" },
            { id: "text", label: "🧠 Instant Analyzer" },
            { id: "upload", label: "📁 File Upload" },
          ].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`pb-3 text-sm font-semibold transition-colors ${activeTab === t.id ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "live" ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Control Panel */}
            <div className="lg:col-span-1 space-y-5">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-gray-900">Stream Control</h2>

                {/* Status */}
                <div className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${connected ? (streamRunning ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700")
                  : "bg-red-50 text-red-600"
                  }`}>
                  <span className={`h-2 w-2 rounded-full ${connected ? (streamRunning ? "bg-green-500 animate-pulse" : "bg-yellow-400") : "bg-red-500"}`} />
                  {connected ? (streamRunning ? "Stream is LIVE" : "Stream is Paused") : "Disconnected from backend"}
                </div>

                {/* Speed selector */}
                <label className="mb-2 block text-xs font-semibold text-gray-600 uppercase">Processing Speed</label>
                <div className="mb-5 grid grid-cols-3 gap-2">
                  {SPEED_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setSpeed(opt.value)} disabled={streamRunning}
                      className={`rounded-lg border py-2 text-xs font-medium transition-colors ${speed === opt.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        } disabled:opacity-50`}>
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {!streamRunning ? (
                    <button onClick={handleStart} disabled={loading || !connected}
                      className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                      ▶ Start Live Analysis
                    </button>
                  ) : (
                    <button onClick={handleStop} disabled={loading}
                      className="w-full rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                      ⏹ Stop Stream
                    </button>
                  )}
                  <button onClick={handleReset} disabled={loading || streamRunning}
                    className="w-full rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    🔄 Reset Session Data
                  </button>
                </div>
              </div>

              {/* Session Stats */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-gray-900">Session Stats</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Records</span>
                    <span className="font-bold text-gray-900">{stats.total.toLocaleString()}</span>
                  </div>
                  {Object.entries(stats.sentiment).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-500">{k}</span>
                      <span className={`font-semibold ${SENTIMENT_COLOR[k]}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Feed Panel */}
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Live Analysis Feed</h2>
                <span className="text-xs text-gray-400">{records.length} records received</span>
              </div>
              <div className="h-[520px] overflow-y-auto space-y-2 pr-1">
                {records.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                    <span className="text-5xl mb-4">📡</span>
                    <p className="font-medium">Stream is idle</p>
                    <p className="text-sm mt-1">Click "Start Live Analysis" to begin real-time processing.</p>
                  </div>
                ) : records.map((r, i) => (
                  <div key={`${r.id}-${i}`}
                    className={`rounded-lg border p-3 text-sm transition-all ${i === 0 ? "ring-2 ring-blue-400/40" : ""
                      } ${r.sentiment === "Positive" ? "border-green-200 bg-green-50"
                        : r.sentiment === "Negative" ? "border-red-200 bg-red-50"
                          : "border-gray-200 bg-gray-50"
                      }`}>
                    <p className="text-gray-700 line-clamp-2">{r.text}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className={`font-bold ${SENTIMENT_COLOR[r.sentiment]}`}>{r.sentiment}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-blue-600">{r.emotion}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500">{Math.round(r.confidence * 100)}% confidence</span>
                      <span className="ml-auto text-gray-400">{new Date(r.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === "text" ? (
          /* Instant Analyzer Tab */
          <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">Analyze Single Sentence</h2>
              <textarea
                value={singleText}
                onChange={(e) => setSingleText(e.target.value)}
                placeholder="Type or paste text here (e.g., 'The new interface is amazing, I love it!')"
                className="w-full h-32 rounded-lg border border-gray-200 p-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
              <button
                disabled={analyzing || !singleText.trim()}
                onClick={async () => {
                  setAnalyzing(true);
                  try {
                    const res = await analyzeSingleTweet(singleText);
                    setAnalysisResult(res);
                  } finally {
                    setAnalyzing(false);
                  }
                }}
                className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {analyzing ? "Analyzing..." : "Analyze Instantly"}
              </button>
            </div>

            {analysisResult && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="mb-4 text-sm font-semibold text-gray-500 uppercase">Analysis Results</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className={`rounded-lg border p-4 ${analysisResult.sentiment === "Positive" ? "border-green-100 bg-green-50" :
                      analysisResult.sentiment === "Negative" ? "border-red-100 bg-red-50" : "border-gray-100 bg-gray-50"
                    }`}>
                    <p className="text-xs text-gray-500 font-medium">SENTIMENT</p>
                    <p className={`text-xl font-bold ${SENTIMENT_COLOR[analysisResult.sentiment]}`}>{analysisResult.sentiment}</p>
                    <p className="text-xs text-gray-400 mt-1">{Math.round(analysisResult.confidence * 100)}% confidence</p>
                  </div>
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs text-gray-500 font-medium">EMOTION</p>
                    <p className="text-xl font-bold text-blue-700">{analysisResult.emotion}</p>
                    <p className="text-xs text-gray-400 mt-1">Detected via VADER+TextBlob</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* File Upload Tab */
          <div className="max-w-xl">
            <div className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${file ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50 hover:bg-white"}`}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">☁️</div>
              <h3 className="text-lg font-semibold text-gray-900">{file ? file.name : "Select a CSV or XLSX file"}</h3>
              <p className="mt-1 text-sm text-gray-500">Datasets up to 50MB supported</p>
              <input type="file" accept=".csv,.xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="mt-6 inline-block cursor-pointer rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700">
                Browse Files
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
