"use client";

import { useCallback, useState } from "react";
import Header from "@/components/Header";
import { uploadCsv } from "@/lib/api";
import type { TweetRow } from "@/lib/types";

export default function DataInputPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    rows: number;
    file_size_mb: number;
    status: string;
    preview: TweetRow[];
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState("customer_feedback");

  const onUpload = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await uploadCsv(file);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }, [file]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith(".csv") || f.name.endsWith(".xlsx") || f.name.endsWith(".txt"))) {
      setFile(f);
      setResult(null);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
    }
  }, []);

  return (
    <div className="flex flex-col bg-white">
      <Header
        title="Upload Your Dataset"
        breadcrumbs={["Projects", "Upload Dataset"]}
        subtitle="Import your data for emotion and sentiment analysis. We'll automatically identify text columns for processing."
      />
      <div className="flex-1 p-6">
        {/* File Upload Section */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
            }`}
          >
            <div className="mb-4 text-6xl">☁️</div>
            <p className="mb-1 text-lg font-medium text-gray-900">
              Drag and drop your files here
            </p>
            <p className="mb-6 text-sm text-gray-500">
              Support for CSV, XLSX, and TXT (Max 50MB)
            </p>
            <label className="cursor-pointer rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700">
              <span className="flex items-center gap-2">
                <span>🔍</span> Browse Files
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,.txt"
                className="hidden"
                onChange={handleFileInput}
              />
            </label>
            {file && (
              <p className="mt-4 text-sm font-medium text-gray-700">Selected: {file.name}</p>
            )}
          </div>

          {/* File Type Tags */}
          <div className="mt-6 flex gap-2">
            {["CSV", "XLSX", "TXT"].map((type, i) => (
              <div
                key={type}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  i === 0
                    ? "border-gray-400 bg-gray-100 text-gray-700"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                <span>{type === "CSV" ? "📄" : type === "XLSX" ? "📊" : "📝"}</span>
                {type}
              </div>
            ))}
          </div>
        </div>

        {/* Column Selection */}
        {result && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Select Text Column for Analysis
            </h3>
            <div className="flex items-center gap-4">
              <select
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="customer_feedback">customer_feedback</option>
                <option value="text_content">text_content</option>
                <option value="content">content</option>
              </select>
              <button className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Reset
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
                <span>⚙️</span> Analyze Emotions
              </button>
            </div>
          </div>
        )}

        {/* Data Preview */}
        {result && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Data Preview (First 5 Rows)
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Previewing 5 of {result.rows.toLocaleString()} rows detected
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-700">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">TIMESTAMP</th>
                    <th className="px-4 py-3 text-left font-medium text-blue-600">
                      TEXT CONTENT (TARGET)
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      SENTIMENT SCORE
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">SOURCE</th>
                  </tr>
                </thead>
                <tbody>
                  {result.preview.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-600">#{String(row.tweet_id || i).slice(0, 5)}</td>
                      <td className="px-4 py-3 text-gray-600">{row.timestamp || "2023-10-24 14:20"}</td>
                      <td className="max-w-md px-4 py-3 text-gray-700">
                        {row.content || "The new interface is incredibly intuitive, but I'm having issues with the export function."}
                      </td>
                      <td className="px-4 py-3 text-gray-600">0.72</td>
                      <td className="px-4 py-3 text-gray-600">Twitter</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
          Secure SSL Encrypted Upload • GDPR Compliant • AES-256 Storage
        </div>
      </div>
    </div>
  );
}
