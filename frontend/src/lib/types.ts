export type Sentiment = "Positive" | "Negative" | "Neutral";
export type Emotion = "Happy" | "Angry" | "Sad" | "Fear" | "Neutral";

export interface SentimentResponse {
  sentiment: Sentiment;
  confidence: number;
  emotion?: Emotion;
}

export interface TweetRow {
  tweet_id: string;
  timestamp: string;
  handle: string;
  content: string;
  cleaned_text?: string;
  tokens?: string[];
  sentiment?: Sentiment;
  confidence?: number;
  emotion?: Emotion;
}

export interface UploadResponse {
  rows: number;
  file_size_mb: number;
  status: string;
  preview: TweetRow[];
}

export interface BeforeAfterSample {
  raw: string;
  cleaned_text: string;
  cleaned_tokens: string[];
}

export interface DashboardData {
  sentiment_counts: Record<string, number>;
  emotion_counts: Record<string, number>;
  sentiment_over_time: { date: string; Positive: number; Negative: number; Neutral: number }[];
  top_words: { word: string; count: number }[];
}

export interface InsightsSummary {
  summary: string;
  counts?: { sentiment?: Record<string, number>; emotion?: Record<string, number> };
}
