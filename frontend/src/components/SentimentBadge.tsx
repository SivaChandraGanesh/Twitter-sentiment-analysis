"use client";

import type { Sentiment } from "@/lib/types";

const styles: Record<Sentiment, string> = {
  Positive: "bg-green-100 text-green-700",
  Negative: "bg-red-100 text-red-700",
  Neutral: "bg-gray-100 text-gray-700",
};

export default function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[sentiment] ?? styles.Neutral}`}
    >
      {sentiment}
    </span>
  );
}
