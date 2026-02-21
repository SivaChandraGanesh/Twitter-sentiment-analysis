import axios from "axios";
import type {
  UploadResponse,
  BeforeAfterSample,
  DashboardData,
  InsightsSummary,
  SentimentResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
export const WS_BASE = API_BASE.replace(/^http/, "ws");

const client = axios.create({ baseURL: API_BASE, timeout: 60000 });

// ── Upload ──────────────────────────────────────────────────────────
export async function uploadCsv(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await client.post<UploadResponse>("/api/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// ── Preprocessing ───────────────────────────────────────────────────
export async function preprocess(): Promise<{
  message: string;
  before_after: BeforeAfterSample[];
  total: number;
}> {
  const { data } = await client.post("/api/preprocess");
  return data;
}

// ── Sentiment & Emotion ─────────────────────────────────────────────
export async function runSentiment(): Promise<{
  total: number;
  counts: Record<string, number>;
  table: unknown[];
}> {
  const { data } = await client.post("/api/analyze/sentiment");
  return data;
}

export async function runEmotion(): Promise<{
  total: number;
  emotion_counts: Record<string, number>;
  table: unknown[];
}> {
  const { data } = await client.post("/api/analyze/emotion");
  return data;
}

export async function analyzeSingleTweet(tweet: string): Promise<SentimentResponse> {
  const { data } = await client.post<SentimentResponse>("/api/analyze/single", { tweet });
  return data;
}

// ── Visualizations / Dashboard ──────────────────────────────────────
export async function getDashboardData(params?: {
  sentiment_filter?: string;
}): Promise<DashboardData> {
  const { data } = await client.get<DashboardData>("/api/dashboard", { params });
  return data;
}

export async function getInsightsSummary(): Promise<InsightsSummary> {
  const { data } = await client.get<InsightsSummary>("/api/insights/summary");
  return data;
}

export async function getPreview(limit = 50) {
  const { data } = await client.get<{ preview: unknown[]; total: number }>(
    `/api/dataset/preview?limit=${limit}`
  );
  return data;
}

// ── Reports ─────────────────────────────────────────────────────────
export function getCsvExportUrl(): string {
  return `${API_BASE}/api/export/csv`;
}

export function getPdfExportUrl(): string {
  return `${API_BASE}/api/export/pdf`;
}

export async function exportReportText(): Promise<{ report: string }> {
  const { data } = await client.get<{ report: string }>("/api/export/report-text");
  return data;
}

// ── Real-Time Stream Controls ────────────────────────────────────────
export async function startStream(interval = 2.0) {
  const { data } = await client.post(`/api/stream/start?interval=${interval}`);
  return data;
}

export async function stopStream() {
  const { data } = await client.post("/api/stream/stop");
  return data;
}

export async function pauseStream() {
  const { data } = await client.post("/api/stream/pause");
  return data;
}

export async function resetStream() {
  const { data } = await client.post("/api/stream/reset");
  return data;
}

export async function getStreamStatus(): Promise<{
  running: boolean;
  clients: number;
  stats: {
    total: number;
    sentiment: Record<string, number>;
    emotion: Record<string, number>;
    started_at: string | null;
  };
}> {
  const { data } = await client.get("/api/stream/status");
  return data;
}

// ── Health ───────────────────────────────────────────────────────────
export async function healthCheck(): Promise<boolean> {
  try {
    await client.get("/api/health");
    return true;
  } catch {
    return false;
  }
}
