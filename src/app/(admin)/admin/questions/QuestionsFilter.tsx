"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Topic {
  id: string;
  name: string;
  section: string;
}

interface QuestionsFilterProps {
  topics: Topic[];
}

export default function QuestionsFilter({ topics }: QuestionsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [topicId, setTopicId] = useState(searchParams.get("topicId") || "");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "");

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (topicId) params.set("topicId", topicId);
    if (difficulty) params.set("difficulty", difficulty);

    const queryString = params.toString();
    router.push(`/admin/questions${queryString ? `?${queryString}` : ""}`);
  };

  const handleClear = () => {
    setTopicId("");
    setDifficulty("");
    router.push("/admin/questions");
  };

  return (
    <div
      className="rounded-xl p-4 mb-6"
      style={{
        backgroundColor: "var(--bg-primary)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Topic
          </label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
            style={{ borderColor: "var(--border-default)" }}
          >
            <option value="">All Topics</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name} ({topic.section.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
            style={{ borderColor: "var(--border-default)" }}
          >
            <option value="">All Levels</option>
            <option value="l1">L1 - Foundation</option>
            <option value="l2">L2 - Intermediate</option>
            <option value="l3">L3 - UPSC</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleFilter}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-primary)",
            }}
          >
            Filter
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-lg text-sm font-medium border"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
