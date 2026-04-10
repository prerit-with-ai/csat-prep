"use client";

import { useEffect, useState } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

type Passage = {
  id: string;
  title: string;
  passageText: string;
  difficulty: string;
};

type Props = {
  passageId: string;
};

export function PassageDisplay({ passageId }: Props) {
  const [passage, setPassage] = useState<Passage | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setPassage(null);
    setCollapsed(false);
    fetch(`/api/passages/${passageId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.id) setPassage(d);
      })
      .catch(() => {});
  }, [passageId]);

  if (!passage) return null;

  return (
    <div
      className="mb-6 rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border-default)" }}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderBottom: collapsed ? "none" : "1px solid var(--border-default)",
        }}
      >
        <div>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Passage: {passage.title}
          </span>
        </div>
        <span className="text-xs ml-4 shrink-0" style={{ color: "var(--text-tertiary)" }}>
          {collapsed ? "Show ▼" : "Hide ▲"}
        </span>
      </button>

      {!collapsed && (
        <div className="px-5 py-4" style={{ maxHeight: "40vh", overflowY: "auto" }}>
          <MarkdownRenderer content={passage.passageText} />
        </div>
      )}
    </div>
  );
}
