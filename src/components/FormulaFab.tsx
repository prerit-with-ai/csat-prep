"use client";

import { useEffect, useState } from "react";
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

export default function FormulaFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<FormulasResponse | null>(null);
  const [loading, setLoading] = useState(true);

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

          if (matchesTopicName) {
            return topic;
          }

          if (matchingCards.length > 0) {
            return { ...topic, cards: matchingCards };
          }

          return null;
        })
        .filter(Boolean) as TopicWithCards[]
    : [];

  const hasSearchResults = filteredTopics.length > 0;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 font-semibold text-body transition-opacity hover:opacity-80"
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
          className="fixed inset-0 bg-black bg-opacity-50 z-[90]"
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
            <h2 className="text-section font-semibold">Formula Cards</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:opacity-70 transition-opacity"
              aria-label="Close"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Search Input */}
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <input
              type="text"
              placeholder="Search formulas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-body"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                outline: "none",
              }}
            />
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {!hasSearchResults && searchQuery && (
              <div
                className="text-center py-8 text-body"
                style={{ color: "var(--text-tertiary)" }}
              >
                No formulas match your search.
              </div>
            )}

            {!hasSearchResults && !searchQuery && (
              <div
                className="text-center py-8 text-body"
                style={{ color: "var(--text-tertiary)" }}
              >
                No formula cards yet.
              </div>
            )}

            {hasSearchResults && (
              <div className="space-y-6">
                {filteredTopics.map((topic) => (
                  <div key={topic.topicId}>
                    <div className="mb-3">
                      <div className="text-body font-semibold">
                        {topic.topicName}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {topic.topicSection}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {topic.cards
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((card) => (
                          <div
                            key={card.id}
                            className="p-4"
                            style={{
                              border: "1px solid var(--border-default)",
                              borderRadius: "12px",
                              backgroundColor: "var(--bg-secondary)",
                            }}
                          >
                            <MarkdownRenderer content={card.content} />
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
