"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

type FormulaCard = {
  id: string;
  content: string;
  displayOrder: number;
};

type TopicWithCards = {
  topicId: string;
  topicName: string;
  topicSection: string;
  cards: FormulaCard[];
};

type FormulasResponse = {
  topics: TopicWithCards[];
};

// ─── Public helper ────────────────────────────────────────────────────────────
// Call this from anywhere to open the panel scrolled to a specific topic.
export function openFormulaCard(topicId: string) {
  window.dispatchEvent(
    new CustomEvent("open-formula-card", { detail: { topicId } })
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FormulaFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<FormulasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [highlightTopicId, setHighlightTopicId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchFormulas() {
      try {
        const res = await fetch("/api/formulas");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch formulas:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFormulas();
  }, []);

  // Listen for deep-link events from solution views
  useEffect(() => {
    const handler = (e: Event) => {
      const topicId = (e as CustomEvent<{ topicId: string }>).detail?.topicId;
      setIsOpen(true);
      setSearchQuery(""); // clear search so the topic is visible
      setHighlightTopicId(topicId ?? null);

      // Scroll to the topic section after the panel renders
      if (topicId) {
        setTimeout(() => {
          const el = document.getElementById(`formula-topic-${topicId}`);
          if (el && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: el.offsetTop - 16,
              behavior: "smooth",
            });
          }
        }, 80);
      }
    };

    window.addEventListener("open-formula-card", handler);
    return () => window.removeEventListener("open-formula-card", handler);
  }, []);

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (loading) return null;

  const hasAnyCards = data?.topics.some((t) => t.cards.length > 0);
  if (!hasAnyCards) return null;

  const filteredTopics = data
    ? data.topics
        .map((topic) => {
          const matchesTopicName = topic.topicName
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          const matchingCards = topic.cards.filter((card) =>
            card.content.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (matchesTopicName) return topic;
          if (matchingCards.length > 0) return { ...topic, cards: matchingCards };
          return null;
        })
        .filter(Boolean) as TopicWithCards[]
    : [];

  const hasSearchResults = filteredTopics.length > 0;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => { setIsOpen(true); setHighlightTopicId(null); }}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 font-semibold text-sm transition-opacity hover:opacity-80"
        style={{
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-default)",
          borderRadius: "12px",
        }}
        aria-label="Open formula cards"
      >
        ∑ Formulas
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90]"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over Panel */}
      {isOpen && (
        <div
          className="fixed top-0 right-0 bottom-0 z-[100] overflow-hidden flex flex-col"
          style={{
            width: "min(360px, 100vw)",
            backgroundColor: "var(--bg-primary)",
            borderLeft: "1px solid var(--border-default)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-4"
            style={{ borderBottom: "1px solid var(--border-default)" }}
          >
            <h2 className="text-section">Formula Cards</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-8 h-8 rounded-md transition-opacity hover:opacity-70"
              aria-label="Close"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Search */}
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-default)" }}
          >
            <input
              type="text"
              placeholder="Search formulas…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                outline: "none",
              }}
            />
          </div>

          {/* Scrollable body */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4"
          >
            {!hasSearchResults && searchQuery && (
              <p
                className="text-center py-8 text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                No formulas match your search.
              </p>
            )}

            {!hasSearchResults && !searchQuery && (
              <p
                className="text-center py-8 text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                No formula cards yet.
              </p>
            )}

            {hasSearchResults && (
              <div className="space-y-6">
                {filteredTopics.map((topic) => {
                  const isHighlighted = topic.topicId === highlightTopicId;
                  return (
                    <div
                      key={topic.topicId}
                      id={`formula-topic-${topic.topicId}`}
                    >
                      {/* Topic label */}
                      <div
                        className="flex items-center gap-2 mb-3 pb-2"
                        style={{
                          borderBottom: isHighlighted
                            ? "2px solid var(--color-info)"
                            : "1px solid var(--border-subtle)",
                        }}
                      >
                        <span
                          className="text-sm font-semibold"
                          style={{
                            color: isHighlighted
                              ? "var(--color-info)"
                              : "var(--text-primary)",
                          }}
                        >
                          {topic.topicName}
                        </span>
                        <span
                          className="text-xs uppercase tracking-wide"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {topic.topicSection}
                        </span>
                      </div>

                      {/* Cards */}
                      <div className="space-y-3">
                        {topic.cards
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((card) => (
                            <div
                              key={card.id}
                              className="p-4"
                              style={{
                                border: isHighlighted
                                  ? "1px solid var(--color-info-bg)"
                                  : "1px solid var(--border-default)",
                                borderRadius: "12px",
                                backgroundColor: isHighlighted
                                  ? "var(--color-info-bg)"
                                  : "var(--bg-secondary)",
                              }}
                            >
                              <MarkdownRenderer content={card.content} />
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
