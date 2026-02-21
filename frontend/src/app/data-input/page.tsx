"use client";

import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import { useWebSocket } from "@/lib/useWebSocket";
import { startStream, stopStream, resetStream } from "@/lib/api";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const SPEED_OPTIONS = [
  { label: "⚡ Fast (1s)", value: 1.0 },
  { label: "🔥 Normal (2s)", value: 2.0 },
  { label: "🐢 Slow (4s)", value: 4.0 },
];

const SENTIMENT_COLOR: Record<string, string> = {
  Positive: "text-green-600",
  Negative: "text-red-500",
  Neutral: "text-gray-500",
};

const SENTIMENT_BG: Record<string, string> = {
  Positive: "bg-green-50 border-green-200",
  Negative: "bg-red-50 border-red-200",
  Neutral: "bg-gray-50 border-gray-200",
};

type UploadResult = {
  status: string;
  filename: string;
  total_rows: number;
  analyzed: number;
  error_rows: number;
  text_column_detected: string;
  file_size_kb: number;
  sentiment_distribution: Record<string, number>;
  emotion_distribution: Record<string, number>;
  dominant_emotion: string;
  preview: Array<{
    text: string;
    clean_text: string;
    sentiment: string;
    emotion: string;
    confidence: number;
  }>;
};

type AnalyzeResult = {
  text: string;
  clean_text: string;
  sentiment: string;
  confidence: number;
  emotion: string;
};

// Emoji for each sentiment
const SENTIMENT_EMOJI: Record<string, string> = {
  Positive: "😊",
  Negative: "😞",
  Neutral: "😐",
};

// Emoji for each emotion
const EMOTION_EMOJI: Record<string, string> = {
  Happy: "🎉",
  Angry: "😡",
  Sad: "😢",
  Fear: "😨",
  Neutral: "😶",
};

export default function DataInputPage() {
  const { connected, streamRunning, stats, records } = useWebSocket();
  const [speed, setSpeed] = useState(2.0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"live" | "upload" | "text">("live");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Upload tab state
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "analyzing" | "done" | "error">("idle");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Text analyzer state
  const [singleText, setSingleText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPoll(), []);

  // ── Upload handlers ─────────────────────────────────────────────────────────
  const handleFileUpload = async () => {
    if (!file) return;
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError(null);
    setUploadResult(null);

    const form = new FormData();
    form.append("file", file);

    try {
      // POST the file — get job_id back immediately
      const { data } = await axios.post<{ job_id: string; status: string }>(
        `${API_BASE}/api/upload`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const jobId = data.job_id;
      setUploadStatus("analyzing");
      setUploadProgress(5);

      // Poll for progress every 1.5 seconds
      pollRef.current = setInterval(async () => {
        try {
          const { data: job } = await axios.get(
            `${API_BASE}/api/upload/status/${jobId}`
          );

          setUploadProgress(job.progress ?? 0);

          if (job.status === "done") {
            stopPoll();
            setUploadStatus("done");
            setUploadProgress(100);
            setUploadResult(job.result as UploadResult);
          } else if (job.status === "error") {
            stopPoll();
            setUploadStatus("error");
            setUploadError(job.error || "Analysis failed.");
          }
        } catch {
          // Backend may briefly be unreachable; keep polling
        }
      }, 1500);
    } catch (err: any) {
      setUploadStatus("error");
      setUploadError(
        err?.response?.data?.detail || "Upload failed. Please try again."
      );
    }
  };

  // ── Instant Analyzer ──────────────────────────────────────────────────────
  const handleAnalyzeText = async () => {
    if (!singleText.trim()) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    setAnalyzeError(null);
    try {
      const { data } = await axios.post<AnalyzeResult>(
        `${API_BASE}/api/analyze/single`,
        { text: singleText }
      );
      setAnalysisResult(data);
    } catch (err: any) {
      setAnalyzeError(
        err?.response?.data?.detail || "Analysis failed. Is the backend running?"
      );
    } finally {
      setAnalyzing(false);
    }
  };

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

  // ── Confidence ring helper ────────────────────────────────────────────────
  const ConfidenceRing = ({ value }: { value: number }) => {
    const pct = Math.round(value * 100);
    const r = 26;
    const circ = 2 * Math.PI * r;
    const stroke = circ * (1 - pct / 100);
    return (
      <div className="relative flex items-center justify-center w-20 h-20">
        <svg width="80" height="80" className="-rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="40" cy="40" r={r} fill="none"
            stroke="#3b82f6" strokeWidth="6"
            strokeDasharray={`${circ}`}
            strokeDashoffset={`${stroke}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-sm font-bold text-blue-600">{pct}%</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <Header
        title="Live Data Control"
        breadcrumbs={["Data", "Control"]}
        subtitle="Upload datasets for bulk analysis or control the real-time stream."
      />
      <div className="flex-1 p-6">
        {/* Tab Bar */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          {[
            { id: "live", label: "🔴 Live Stream" },
            { id: "upload", label: "📁 File Upload" },
            { id: "text", label: "🧠 Instant Analyzer" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`pb-3 text-sm font-semibold transition-colors ${activeTab === t.id
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── LIVE STREAM ──────────────────────────────────────────────────── */}
        {activeTab === "live" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-5">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-gray-900">Stream Control</h2>
                <div className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${connected ? (streamRunning ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700") : "bg-red-50 text-red-600"
                  }`}>
                  <span className={`h-2 w-2 rounded-full ${connected ? (streamRunning ? "bg-green-500 animate-pulse" : "bg-yellow-400") : "bg-red-500"}`} />
                  {connected ? (streamRunning ? "Stream is LIVE" : "Stream is Paused") : "Disconnected"}
                </div>
                <label className="mb-2 block text-xs font-semibold text-gray-600 uppercase">Processing Speed</label>
                <div className="mb-5 grid grid-cols-3 gap-2">
                  {SPEED_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setSpeed(opt.value)} disabled={streamRunning}
                      className={`rounded-lg border py-2 text-xs font-medium ${speed === opt.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"} disabled:opacity-50`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {!streamRunning ? (
                    <button onClick={handleStart} disabled={loading || !connected}
                      className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">
                      ▶ Start Live Analysis
                    </button>
                  ) : (
                    <button onClick={handleStop} disabled={loading}
                      className="w-full rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50">
                      ⏹ Stop Stream
                    </button>
                  )}
                  <button onClick={handleReset} disabled={loading || streamRunning}
                    className="w-full rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    🔄 Reset Session Data
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-gray-900">Session Stats</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Total Records</span><span className="font-bold">{stats.total.toLocaleString()}</span></div>
                  {Object.entries(stats.sentiment).map(([k, v]) => (
                    <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className={`font-semibold ${SENTIMENT_COLOR[k]}`}>{v}</span></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Live Analysis Feed</h2>
                <span className="text-xs text-gray-400">{records.length} records</span>
              </div>
              <div className="h-[520px] overflow-y-auto space-y-2 pr-1">
                {records.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                    <span className="text-5xl mb-4">📡</span>
                    <p className="font-medium">Stream is idle</p>
                    <p className="text-sm mt-1">Click "Start Live Analysis" to begin.</p>
                  </div>
                ) : (
                  records.map((r, i) => (
                    <div key={`${r.id}-${i}`} className={`rounded-lg border p-3 text-sm ${i === 0 ? "ring-2 ring-blue-400/40" : ""} ${SENTIMENT_BG[r.sentiment] ?? "bg-gray-50 border-gray-200"}`}>
                      <p className="text-gray-700 line-clamp-2">{r.text}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className={`font-bold ${SENTIMENT_COLOR[r.sentiment]}`}>{r.sentiment}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-blue-600">{r.emotion}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500">{Math.round(r.confidence * 100)}%</span>
                        <span className="ml-auto text-gray-400">{new Date(r.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── FILE UPLOAD ───────────────────────────────────────────────────── */}
        {activeTab === "upload" && (
          <div className="max-w-3xl space-y-6">
            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${file ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-white"
                }`}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">☁️</div>
              <h3 className="text-lg font-semibold text-gray-900">
                {file ? file.name : "Drop or select a CSV / XLSX file"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {file ? `${(file.size / 1024).toFixed(1)} KB — click to change` : "Up to 50MB. Text column auto-detected."}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  setUploadResult(null);
                  setUploadError(null);
                  setUploadStatus("idle");
                  setUploadProgress(0);
                  stopPoll();
                }}
              />
            </div>

            {/* Analyze button */}
            {file && uploadStatus === "idle" && (
              <button onClick={handleFileUpload}
                className="w-full rounded-xl bg-blue-600 py-4 text-base font-bold text-white hover:bg-blue-700 transition-colors">
                🚀 Analyze & Store All Rows
              </button>
            )}

            {/* Progress Bar */}
            {(uploadStatus === "uploading" || uploadStatus === "analyzing") && (
              <div className="space-y-3">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
                  <p className="font-semibold text-blue-800">
                    {uploadStatus === "uploading" ? "⏫ Uploading file..." : `⚙️ Analyzing rows... (${uploadProgress}%)`}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Please keep this tab open. Large files can take a few minutes.</p>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-700"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-gray-500">{uploadProgress}% complete</p>
              </div>
            )}

            {/* Error */}
            {uploadStatus === "error" && uploadError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                ❌ {uploadError}
                <button onClick={() => setUploadStatus("idle")} className="ml-3 underline text-xs">Try again</button>
              </div>
            )}

            {/* Results */}
            {uploadStatus === "done" && uploadResult && (
              <div className="space-y-5">
                <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-bold text-green-800 text-lg">✅ Analysis Complete!</p>
                      <p className="text-sm text-green-700 mt-0.5">
                        {uploadResult.analyzed.toLocaleString()} rows analyzed from <strong>{uploadResult.filename}</strong>
                      </p>
                    </div>
                    <a href="/" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                      📊 View Dashboard →
                    </a>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {Object.entries(uploadResult.sentiment_distribution).map(([s, c]) => (
                    <div key={s} className={`rounded-xl border p-4 text-center ${SENTIMENT_BG[s] ?? "bg-gray-50 border-gray-200"}`}>
                      <p className="text-2xl mb-1">{SENTIMENT_EMOJI[s] ?? "📊"}</p>
                      <p className="text-xs font-semibold uppercase text-gray-500">{s}</p>
                      <p className={`mt-1 text-3xl font-bold ${SENTIMENT_COLOR[s]}`}>{c.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {uploadResult.analyzed > 0 ? `${Math.round((c / uploadResult.analyzed) * 100)}%` : "0%"}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                    <p className="text-xs font-semibold uppercase text-gray-500 mb-3">Top Emotions</p>
                    <div className="space-y-1.5">
                      {Object.entries(uploadResult.emotion_distribution).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([e, c]) => (
                        <div key={e} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{EMOTION_EMOJI[e] ?? "🔵"} {e}</span>
                          <span className="font-bold text-blue-700">{c.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-2 text-sm">
                    <p className="text-xs font-semibold uppercase text-gray-500 mb-2">File Info</p>
                    <div className="flex justify-between"><span className="text-gray-400">Total Rows</span><span className="font-semibold">{uploadResult.total_rows}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Analyzed</span><span className="font-semibold text-green-600">{uploadResult.analyzed}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Skipped/Errors</span><span className="font-semibold text-red-500">{uploadResult.error_rows}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Text Column</span><span className="font-mono text-xs font-semibold">{uploadResult.text_column_detected}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">File Size</span><span className="font-semibold">{uploadResult.file_size_kb} KB</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Dominant Emotion</span><span className="font-semibold text-blue-700">{uploadResult.dominant_emotion}</span></div>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3">
                    <p className="text-sm font-semibold text-gray-700">Row Preview (first {uploadResult.preview.length})</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-100">
                        <tr>
                          {["Text", "Clean Text", "Sentiment", "Emotion", "Confidence"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {uploadResult.preview.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-700 max-w-[140px] truncate">{row.text}</td>
                            <td className="px-3 py-2 text-gray-400 max-w-[140px] truncate">{row.clean_text}</td>
                            <td className="px-3 py-2"><span className={`font-bold ${SENTIMENT_COLOR[row.sentiment]}`}>{row.sentiment}</span></td>
                            <td className="px-3 py-2 text-blue-700">{row.emotion}</td>
                            <td className="px-3 py-2 text-gray-500">{Math.round(row.confidence * 100)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <button onClick={() => { setFile(null); setUploadStatus("idle"); setUploadResult(null); setUploadProgress(0); }}
                  className="text-sm text-blue-600 hover:underline">
                  ← Upload another file
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── INSTANT ANALYZER ───────────────────────────────────────────── */}
        {activeTab === "text" && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 font-semibold text-gray-900 text-lg">Analyze a Single Sentence</h2>
              <p className="mb-4 text-sm text-gray-500">Type or paste any text and get instant sentiment & emotion analysis.</p>
              <textarea
                value={singleText}
                onChange={(e) => setSingleText(e.target.value)}
                placeholder="e.g., 'The new interface is amazing, I love it!'"
                rows={4}
                className="w-full rounded-xl border border-gray-200 p-4 text-sm resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              />
              <button
                disabled={analyzing || !singleText.trim()}
                onClick={handleAnalyzeText}
                className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {analyzing ? "⏳ Analyzing..." : "⚡ Analyze Instantly"}
              </button>
              {analyzeError && (
                <p className="mt-3 text-xs text-red-500">❌ {analyzeError}</p>
              )}
            </div>

            {/* Rich Analysis Output */}
            {analysisResult && (
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                {/* Header bar */}
                <div className={`px-6 py-4 ${SENTIMENT_BG[analysisResult.sentiment] ?? "bg-gray-50"} border-b border-gray-200`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{SENTIMENT_EMOJI[analysisResult.sentiment] ?? "📊"}</span>
                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500">Overall Sentiment</p>
                        <p className={`text-2xl font-extrabold ${SENTIMENT_COLOR[analysisResult.sentiment]}`}>
                          {analysisResult.sentiment}
                        </p>
                      </div>
                    </div>
                    <ConfidenceRing value={analysisResult.confidence} />
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Emotion */}
                  <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <span className="text-4xl">{EMOTION_EMOJI[analysisResult.emotion] ?? "🔵"}</span>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Detected Emotion</p>
                      <p className="text-xl font-bold text-blue-700">{analysisResult.emotion}</p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Confidence Score</span>
                      <span className="font-bold text-blue-700">{Math.round(analysisResult.confidence * 100)}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${analysisResult.sentiment === "Positive" ? "bg-green-500" :
                            analysisResult.sentiment === "Negative" ? "bg-red-500" : "bg-gray-400"
                          }`}
                        style={{ width: `${Math.round(analysisResult.confidence * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Input Text */}
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Original Text</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{analysisResult.text}</p>
                  </div>

                  {/* Cleaned Text */}
                  {analysisResult.clean_text && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Cleaned Text (processed by NLP)</p>
                      <p className="text-sm text-gray-500 italic leading-relaxed">{analysisResult.clean_text}</p>
                    </div>
                  )}

                  {/* Sentiment key */}
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> Positive ≥ 0.05
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500" /> Negative ≤ −0.05
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-400" /> Neutral otherwise
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
