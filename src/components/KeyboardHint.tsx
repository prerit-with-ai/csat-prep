"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "csat-kb-hint-dismissed";

interface KeyboardHintProps {
  mode: "practice" | "mock";
}

export function KeyboardHint({ mode }: KeyboardHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
      setVisible(!dismissed);
    } catch {
      setVisible(false);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore storage errors
    }
  };

  if (!visible) return null;

  const hint =
    mode === "practice"
      ? "Press 1–4 to select · Enter to confirm · → for next"
      : "A / B / C to tag · 1–4 to answer · Enter to advance";

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-lg text-xs"
      style={{
        backgroundColor: "var(--bg-tertiary)",
        border: "1px solid var(--border-default)",
        color: "var(--text-tertiary)",
        whiteSpace: "nowrap",
      }}
    >
      <span>⌨ {hint}</span>
      <button
        onClick={dismiss}
        aria-label="Dismiss keyboard hint"
        className="flex items-center opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: "var(--text-tertiary)" }}
      >
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
}
