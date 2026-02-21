"use client";

import { useState } from "react";
import Header from "@/components/Header";

const PREPROCESSING_STEPS = [
  {
    category: "TEXT CLEANING",
    steps: [
      { id: "lowercase", label: "Lowercase", desc: "Normalize text casing", enabled: true },
      { id: "remove_urls", label: "Remove URLs", desc: "Strip http/https links", enabled: true },
      { id: "remove_punctuation", label: "Remove Punctuation", desc: "Delete all special symbols", enabled: true },
      { id: "remove_emojis", label: "Remove Emojis", desc: "Filter out Unicode icons", enabled: false },
    ],
  },
  {
    category: "LINGUISTIC PROCESSING",
    steps: [
      { id: "stopwords", label: "Stopword Removal", desc: "Remove frequent low-value words", enabled: true },
      { id: "tokenization", label: "Tokenization", desc: "Split text into individual tokens", enabled: true },
      { id: "lemmatization", label: "Lemmatization", desc: "Reduce words to base/root form", enabled: false },
    ],
  },
];

const RAW_TEXT = "OMG! I absolutely LOVE this product! 🚀 Check out their website at https://datadrivenerror.com... The sentiment analysis tools are super helpful & useful. #DataScience #NLP";
const PROCESSED_TOKENS = ["omg", "absolutely", "love", "product", "check", "website", "sentiment", "analysis", "tools", "super", "helpful", "useful", "datascience", "nlp"];

export default function PreprocessingPage() {
  const [steps, setSteps] = useState(
    PREPROCESSING_STEPS.flatMap((cat) => cat.steps).reduce(
      (acc, step) => ({ ...acc, [step.id]: step.enabled }),
      {} as Record<string, boolean>
    )
  );

  const toggleStep = (id: string) => {
    setSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col bg-white">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Data Driven Emotion</h1>
            <p className="text-sm text-gray-500">v2.4.0 • Preprocessing</p>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex gap-6 text-sm font-medium text-gray-600">
              {["Dashboard", "Analytics", "Preprocessing", "Models", "Settings"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className={item === "Preprocessing" ? "text-blue-600 underline" : "hover:text-gray-900"}
                >
                  {item}
                </a>
              ))}
            </nav>
            <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Reset to Default
            </button>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Apply Configuration
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-80 border-r border-gray-200 bg-white p-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase text-gray-900">
            <span>🔍</span> PREPROCESSING TASKS
          </h2>
          <p className="mb-6 text-xs text-gray-500">
            Select the cleaning and linguistic operations to apply to your raw datasets.
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
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        steps[step.id] ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          steps[step.id] ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-lg bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-blue-600">ℹ️</span>
              <p className="text-xs font-medium text-blue-900">Pro Tip</p>
            </div>
            <p className="text-xs text-blue-700">
              Lemmatization is computationally expensive. For faster training, consider simple
              stemming instead.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mb-4 text-xs text-gray-500">ANALYTICS &gt; PREPROCESSING</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            NLP Preprocessing Configuration
          </h1>
          <p className="mb-6 text-sm text-gray-600">
            Configure and preview text cleaning tasks for sentiment analysis in real-time.
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Raw Input */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>🔄</span>
                  <h3 className="font-semibold text-gray-900">RAW INPUT TEXT</h3>
                </div>
                <button className="text-sm text-gray-600 hover:text-gray-900">Clear</button>
              </div>
              <textarea
                readOnly
                value={RAW_TEXT}
                className="h-48 w-full resize-none rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700"
              />
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="text-xs text-gray-500">ENCODING: UTF-8</span>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  Tokens: 28
                </span>
              </div>
            </div>

            {/* Processed Output */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>✏️</span>
                  <h3 className="font-semibold text-gray-900">PROCESSED OUTPUT</h3>
                </div>
                <div className="flex gap-2">
                  <button className="text-gray-600 hover:text-gray-900">📋</button>
                  <button className="text-gray-600 hover:text-gray-900">📥</button>
                </div>
              </div>
              <div className="mb-4 min-h-[192px] rounded-lg border border-gray-300 bg-gray-50 p-4">
                <div className="flex flex-wrap gap-2">
                  {PROCESSED_TOKENS.map((token, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      {token}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                <div>
                  <p className="text-xs text-gray-500">CHARACTERS REMOVED</p>
                  <p className="text-lg font-bold text-gray-900">42</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">LANGUAGE DETECTED</p>
                  <p className="text-lg font-bold text-gray-900">English (EN)</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="flex items-center gap-2 text-xs font-medium text-green-600">
                  <span>⚡</span> LIVE SYNC ACTIVE
                </span>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  Tokens: 14
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Status */}
          <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-white bg-gray-200"
                  />
                ))}
              </div>
              <span className="ml-2 text-xs text-gray-500">
                +12 Analysts currently using this configuration
              </span>
            </div>
            <div className="rounded-lg bg-blue-600 px-4 py-2 text-xs text-white">
              ✓ Auto-Processing Complete • Changes applied to preview in 12ms
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
