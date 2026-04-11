"use client";

import { useEffect, useRef } from "react";

function isEditableTarget(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement)?.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (e.target as HTMLElement)?.isContentEditable
  );
}

// ─────────────────────────────────────────────
// Practice / Daily mode shortcuts
// ─────────────────────────────────────────────

interface PracticeShortcutConfig {
  phase: string;
  selectedOption: string | null;
  onSelectOption: (key: string) => void;
  onConfirm: () => void;
  onNext: () => void;
}

export function usePracticeKeyboardShortcuts(config: PracticeShortcutConfig) {
  const ref = useRef(config);
  ref.current = config;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isEditableTarget(e) || e.metaKey || e.ctrlKey || e.altKey) return;

      const { phase, selectedOption, onSelectOption, onConfirm, onNext } =
        ref.current;

      if (phase === "answering") {
        switch (e.key) {
          case "1":
            e.preventDefault();
            onSelectOption("A");
            break;
          case "2":
            e.preventDefault();
            onSelectOption("B");
            break;
          case "3":
            e.preventDefault();
            onSelectOption("C");
            break;
          case "4":
            e.preventDefault();
            onSelectOption("D");
            break;
          case "Enter":
            if (selectedOption) {
              e.preventDefault();
              onConfirm();
            }
            break;
        }
      } else if (phase === "solution") {
        if (e.key === "Enter" || e.key === "ArrowRight" || e.key === " ") {
          e.preventDefault();
          onNext();
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []); // ref keeps handlers current without re-subscribing
}

// ─────────────────────────────────────────────
// Mock mode shortcuts
// ─────────────────────────────────────────────

interface MockShortcutConfig {
  phase: string;
  currentAbcTag: "A" | "B" | "C" | null;
  onSetTag: (tag: "A" | "B" | "C") => void;
  onSetOption: (key: string) => void;
  onAdvance: () => void;
}

export function useMockKeyboardShortcuts(config: MockShortcutConfig) {
  const ref = useRef(config);
  ref.current = config;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isEditableTarget(e) || e.metaKey || e.ctrlKey || e.altKey) return;

      const { phase, currentAbcTag, onSetTag, onSetOption, onAdvance } =
        ref.current;

      const isActive = phase === "first_pass" || phase === "review_b";
      if (!isActive) return;

      switch (e.key) {
        // ABC tagging — always available
        case "a":
        case "A":
          e.preventDefault();
          onSetTag("A");
          break;
        case "b":
        case "B":
          e.preventDefault();
          onSetTag("B");
          break;
        case "c":
        case "C":
          // Only set C-tag when not in A-tagged option-selection mode
          // (avoids ambiguity with option C)
          if (currentAbcTag !== "A") {
            e.preventDefault();
            onSetTag("C");
          }
          break;

        // Option selection — only when A-tagged
        case "1":
          if (currentAbcTag === "A") { e.preventDefault(); onSetOption("A"); }
          break;
        case "2":
          if (currentAbcTag === "A") { e.preventDefault(); onSetOption("B"); }
          break;
        case "3":
          if (currentAbcTag === "A") { e.preventDefault(); onSetOption("C"); }
          break;
        case "4":
          if (currentAbcTag === "A") { e.preventDefault(); onSetOption("D"); }
          break;

        // Advance
        case "Enter":
        case "ArrowRight":
          if (currentAbcTag) {
            e.preventDefault();
            onAdvance();
          }
          break;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
}
