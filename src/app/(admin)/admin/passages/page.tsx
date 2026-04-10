"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Topic = { id: string; name: string; section: string };
type Passage = {
  id: string;
  topicId: string;
  title: string;
  passageText: string;
  difficulty: string;
  createdAt: string;
};

export default function PassagesPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    topicId: "",
    title: "",
    passageText: "",
    difficulty: "l2" as "l1" | "l2" | "l3",
  });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/topics")
      .then((r) => r.json())
      .then((d) => setTopics(d.topics || []));
  }, []);

  useEffect(() => {
    loadPassages();
  }, [selectedTopicId]);

  const loadPassages = async () => {
    setLoading(true);
    const url = selectedTopicId
      ? `/api/admin/passages?topicId=${selectedTopicId}`
      : "/api/admin/passages";
    const res = await fetch(url);
    const data = await res.json();
    setPassages(data.passages || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topicId || !form.title || !form.passageText) return;
    setSaving(true);
    await fetch("/api/admin/passages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ topicId: "", title: "", passageText: "", difficulty: "l2" });
    loadPassages();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Archive this passage?")) return;
    await fetch(`/api/admin/passages/${id}`, { method: "DELETE" });
    loadPassages();
  };

  const diffLabel = (d: string) =>
    d === "l1" ? "Easy" : d === "l2" ? "Medium" : "Hard";

  const topicName = (id: string) =>
    topics.find((t) => t.id === id)?.name ?? "Unknown";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          RC Passages
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-primary)" }}
        >
          {showForm ? "Cancel" : "+ New Passage"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-5 rounded-xl space-y-4"
          style={{ border: "1px solid var(--border-default)" }}
        >
          <h2 className="text-section" style={{ color: "var(--text-primary)" }}>
            New Passage
          </h2>

          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
              Topic *
            </label>
            <select
              value={form.topicId}
              onChange={(e) => setForm({ ...form, topicId: e.target.value })}
              required
              className="w-full px-3 py-2 text-sm rounded-lg"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
              }}
            >
              <option value="">Select topic…</option>
              {topics.filter((t) => t.section === "rc").map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              {topics.filter((t) => t.section !== "rc").length > 0 && (
                <optgroup label="Other topics">
                  {topics.filter((t) => t.section !== "rc").map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. Climate Policy and Carbon Markets"
              className="w-full px-3 py-2 text-sm rounded-lg"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
              Difficulty
            </label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value as "l1" | "l2" | "l3" })}
              className="w-full px-3 py-2 text-sm rounded-lg"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
              }}
            >
              <option value="l1">Easy (L1)</option>
              <option value="l2">Medium (L2)</option>
              <option value="l3">Hard (L3)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
              Passage Text * (Markdown supported)
            </label>
            <textarea
              value={form.passageText}
              onChange={(e) => setForm({ ...form, passageText: e.target.value })}
              required
              rows={10}
              placeholder="Paste the reading comprehension passage here…"
              className="w-full px-3 py-2 text-sm rounded-lg font-mono"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
                resize: "vertical",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-primary)" }}
          >
            {saving ? "Saving…" : "Create Passage"}
          </button>
        </form>
      )}

      {/* Filter */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Filter by topic:
        </label>
        <select
          value={selectedTopicId}
          onChange={(e) => setSelectedTopicId(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg"
          style={{
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Loading…</p>
      ) : passages.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ border: "1px solid var(--border-default)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No passages yet. Create one above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {passages.map((p) => (
            <div
              key={p.id}
              className="rounded-xl"
              style={{ border: "1px solid var(--border-default)" }}
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {p.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {topicName(p.topicId)} · {diffLabel(p.difficulty)} ·{" "}
                    {p.passageText.length} chars
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {expandedId === p.id ? "▲" : "▼"}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: "var(--color-wrong)" }}
                  >
                    Archive
                  </button>
                </div>
              </div>

              {expandedId === p.id && (
                <div
                  className="px-4 pb-4"
                  style={{ borderTop: "1px solid var(--border-subtle)" }}
                >
                  <p className="text-xs font-mono pt-3 whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                    {p.passageText}
                  </p>
                  <p className="text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>
                    ID: {p.id}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
