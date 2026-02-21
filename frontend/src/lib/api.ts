import axios from "axios";
import type {
  UploadResponse,
  BeforeAfterSample,
  DashboardData,
  InsightsSummary,
  SentimentResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const client = axios.create({ baseURL: API_BASE, timeout: 60000 });

export async function uploadCsv(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await client.post<UploadResponse>("/api/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getPreview(limit = 50) {
  const { data } = await client.get<{ preview: unknown[]; total: number }>(
    `/api/dataset/preview?limit=${limit}`
  );
  return data;
}

export async function preprocess(): Promise<{
  message: string;
  before_after: BeforeAfterSample[];
  total: number;
}> {
  const { data } = await client.post("/api/preprocess");
  return data;
}

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

export async function analyzeSingleTweet(tweet: string): Promise<SentimentResponse> {
  const { data } = await client.post<SentimentResponse>("/api/analyze/single", { tweet });
  return data;
}

export async function healthCheck(): Promise<boolean> {
  try {
    await client.get("/api/health");
    return true;
  } catch {
    return false;
  }
}
