"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { preprocess } from "@/lib/api";
import type { BeforeAfterSample } from "@/lib/types";

const PREPROCESSING_STEPS = [
  {
    category: "TEXT CLEANING",
    steps: [
      { id: "lowercase", label: "Lowercase", desc: "Normalize text casing", enabled: true },
      { id: "remove_urls", label: "Remove URLs", desc: "Strip http/https links", enabled: true },
      { id: "remove_mentions", label: "Remove Mentions", desc: "Strip @user mentions", enabled: true },
    ],
  },
  {
    category: "LINGUISTIC PROCESSING",
    steps: [
      { id: "remove_stopwords", label: "Stopword Removal", desc: "Remove frequent low-value words", enabled: true },
      { id: "lemmatize", label: "Lemmatization", desc: "Reduce words to base/root form", enabled: true },
    ],
  },
];

type Sample = BeforeAfterSample;

export default function PreprocessingPage() {
  const [steps, setSteps] = useState(
    PREPROCESSING_STEPS.flatMap((cat) => cat.steps).reduce(
      (acc, step) => ({ ...acc, [step.id]: step.enabled }),
      {} as Record<string, boolean>
    )
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; total: number; before_after: Sample[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleStep = (id: string) => {
    setSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApply = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await preprocess();
      setResult(data as { message: string; total: number; before_after: Sample[] });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Preprocessing failed. Make sure a dataset is uploaded.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white">
      <Header
        title="NLP Preprocessing"
        breadcrumbs={["Analytics", "Preprocessing"]}
        subtitle="Configure and apply text cleaning operations to your uploaded dataset."
      />
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-80 border-r border-gray-200 bg-white p-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase text-gray-900">
            <span>🔍</span> PREPROCESSING TASKS
          </h2>
          <p className="mb-6 text-xs text-gray-500">
            Select the cleaning and linguistic operations to apply to your raw dataset.
          </p>

          {PREPROCESSING_STEPS.map((category) => (
            <div key={category.category} className="mb-6">
              <h3 className="mb-3 text-xs font-semibold uppercase text-gray-700">
                {category.category}
              </h3>
              <div className="space-y-3">
                {category.steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{step.label}</p>
                      <p className="text-xs text-gray-500">{step.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleStep(step.id)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${steps[step.id] ? "bg-blue-600" : "bg-gray-300"
                        }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${steps[step.id] ? "translate-x-5" : ""
                          }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleApply}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "⏳ Processing..." : "⚙️ Apply & Run Pipeline"}
          </button>
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600">{error}</div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {!result ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-4">
              <span className="text-6xl">🔧</span>
              <p className="text-lg font-medium">Configure options and click "Apply & Run Pipeline"</p>
              <p className="text-sm">Make sure you have uploaded a dataset first.</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-700">✅ {result.message}</p>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  {result.total.toLocaleString()} records processed
                </span>
              </div>

              <h2 className="mb-4 text-lg font-semibold text-gray-900">Before / After Samples</h2>
              <div className="space-y-4">
                {result.before_after.map((sample, i) => (
                  <div key={i} className="grid gap-4 lg:grid-cols-2 rounded-xl border border-gray-200 p-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Raw Text</p>
                      <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{sample.before}</p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Cleaned Text</p>
                      <div className="flex flex-wrap gap-2 rounded-lg bg-blue-50 p-3">
                        {sample.after.split(" ").map((token, j) => (
                          <span key={j} className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            {token}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
