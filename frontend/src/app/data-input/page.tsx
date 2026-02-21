"use client";

import { useCallback, useState } from "react";
import Header from "@/components/Header";
import { uploadCsv, analyzeSingleTweet } from "@/lib/api";
import type { TweetRow } from "@/lib/types";

export default function DataInputPage() {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    rows: number;
    status: string;
    preview: TweetRow[];
  } | null>(null);

  // Text Analyzer State
  const [inputText, setInputText] = useState("");
  const [singleResult, setSingleResult] = useState<{ sentiment: string; confidence: number; emotion?: string } | null>(null);

  const onUpload = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await uploadCsv(file);
      setResult({ rows: data.rows, status: data.status, preview: data.preview });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }, [file]);

  const onAnalyzeText = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeSingleTweet(inputText);
      setSingleResult(data as any);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white">
      <Header
        title="Data Input & Analyzer"
        breadcrumbs={["Analytics", "Input"]}
        subtitle="Upload datasets for batch processing or analyze single entries instantly."
      />
      <div className="flex-1 p-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("file")}
            className={`pb-3 text-sm font-semibold transition-colors ${activeTab === "file" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            📁 File Upload
          </button>
          <button
            onClick={() => setActiveTab("text")}
            className={`pb-3 text-sm font-semibold transition-colors ${activeTab === "text" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            ⌨️ Text Analyzer
          </button>
        </div>

        {activeTab === "file" ? (
          <div className="space-y-6">
            <div className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${file ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50 hover:bg-white"}`}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">☁️</div>
              <h3 className="text-lg font-semibold text-gray-900">{file ? file.name : "Select a CSV or XLSX file"}</h3>
              <p className="mt-1 text-sm text-gray-500">Datasets up to 50MB supported</p>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="mt-6 inline-block cursor-pointer rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700">
                Browse Files
              </label>
            </div>
            {file && (
              <button
                onClick={onUpload}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Uploading..." : "Upload & Initialize Dataset"}
              </button>
            )}
            {result && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                ✅ Uploaded successfully! {result.rows} records detected. Go to <strong>Preprocessing</strong> to continue.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Instant Text Analysis</h3>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste text or tweet here to analyze sentiment and emotion instantly..."
                className="h-48 w-full rounded-lg border border-gray-300 p-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={onAnalyzeText}
                disabled={loading || !inputText.trim()}
                className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Analyzing..." : "Analyze Now"}
              </button>
            </div>

            {singleResult && (
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                  <p className="text-xs font-semibold uppercase text-gray-500">Sentiment</p>
                  <p className={`mt-2 text-2xl font-bold ${singleResult.sentiment === "Positive" ? "text-green-600" : singleResult.sentiment === "Negative" ? "text-red-600" : "text-gray-600"}`}>
                    {singleResult.sentiment}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                  <p className="text-xs font-semibold uppercase text-gray-500">Emotion</p>
                  <p className="mt-2 text-2xl font-bold text-blue-600">{singleResult.emotion || "Neutral"}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                  <p className="text-xs font-semibold uppercase text-gray-500">Confidence</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{Math.round(singleResult.confidence * 100)}%</p>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-600">{error}</div>}
      </div>
    </div>
  );
}
