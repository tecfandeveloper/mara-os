"use client";

import { useState, useEffect } from "react";

interface WordItem {
  text: string;
  count: number;
}

interface WordCloudMemoriesProps {
  workspace: string;
  onWordClick?: (word: string) => void;
  className?: string;
}

export function WordCloudMemories({ workspace, onWordClick, className = "" }: WordCloudMemoriesProps) {
  const [words, setWords] = useState<WordItem[]>([]);
  const [maxCount, setMaxCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const w = encodeURIComponent(workspace);
    fetch(`/api/memory/wordcloud?workspace=${w}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setWords(data.words || []);
        setMaxCount(data.maxCount || 1);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load word cloud");
        setWords([]);
      })
      .finally(() => setLoading(false));
  }, [workspace]);

  const minSize = 12;
  const maxSize = 36;

  const getSize = (count: number) => {
    if (maxCount <= 0) return minSize;
    const ratio = count / maxCount;
    return Math.round(minSize + ratio * (maxSize - minSize));
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl p-8 ${className}`}
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", minHeight: 200 }}
      >
        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading word cloud...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-xl p-4 ${className}`}
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <p style={{ color: "var(--error)", fontSize: "0.875rem" }}>{error}</p>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl p-8 ${className}`}
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", minHeight: 200 }}
      >
        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No words to display. Add content to MEMORY.md.</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl p-4 ${className}`}
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <p className="mb-3 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        Word cloud — click a word to search memories
      </p>
      <div
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2"
        style={{ minHeight: 120 }}
      >
        {words.map(({ text, count }) => (
          <button
            key={`${text}-${count}`}
            type="button"
            className="transition-transform duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--card)]"
            style={{
              fontSize: getSize(count),
              color: "var(--accent)",
              background: "none",
              border: "none",
              cursor: onWordClick ? "pointer" : "default",
              padding: "2px 4px",
              fontFamily: "var(--font-heading)",
            }}
            onClick={() => onWordClick?.(text)}
            title={`Search for "${text}" (${count})`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
