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
  before: string;
  after: string;
}


export interface DashboardData {
  sentiment_distribution: Record<string, number>;
  emotion_distribution: Record<string, number>;
  sentiment_over_time: { date: string; Positive: number; Negative: number; Neutral: number }[];
  top_words: { word: string; count: number }[];
  total: number;
}


export interface InsightsSummary {
  summary: string;
  counts?: { sentiment?: Record<string, number>; emotion?: Record<string, number> };
}
