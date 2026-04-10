"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Topic {
  id: string;
  name: string;
  section: string;
}

interface PatternType {
  id: string;
  name: string;
  topicId: string;
}

interface Passage {
  id: string;
  title: string;
}

interface Question {
  id: string;
  topicId: string;
  passageId: string | null;
  patternTypeId: string | null;
  subtopic: string | null;
  difficulty: "l1" | "l2" | "l3";
  questionText: string;
  imageUrl: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "a" | "b" | "c" | "d";
  smartSolution: string;
  detailedSolution: string | null;
  optionAExplanation: string | null;
  optionBExplanation: string | null;
  optionCExplanation: string | null;
  optionDExplanation: string | null;
  sourceType: "custom" | "pyq" | "cat" | "ai";
  sourceYear: number | null;
  language: "en" | "hi";
}

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;

  const [topics, setTopics] = useState<Topic[]>([]);
  const [patternTypes, setPatternTypes] = useState<PatternType[]>([]);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showOptionExplanations, setShowOptionExplanations] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<Question | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData?.topicId) {
      fetchPatternTypes(formData.topicId);
      fetchPassages(formData.topicId);
    } else {
      setPatternTypes([]);
      setPassages([]);
    }
  }, [formData?.topicId]);

  const fetchData = async () => {
    try {
      const [topicsRes, questionRes] = await Promise.all([
        fetch("/api/admin/topics"),
        fetch(`/api/admin/questions/${questionId}`),
      ]);

      if (!topicsRes.ok || !questionRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const topicsData = await topicsRes.json();
      const questionData = await questionRes.json();

      setTopics(topicsData.topics || []);
      setFormData(questionData.question);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchPatternTypes = async (topicId: string) => {
    try {
      const res = await fetch(`/api/admin/patterns?topicId=${topicId}`);
      if (res.ok) {
        const data = await res.json();
        setPatternTypes(data.patterns || []);
      }
    } catch (err) {
      console.error(err);
      setPatternTypes([]);
    }
  };

  const fetchPassages = async (topicId: string) => {
    try {
      const res = await fetch(`/api/admin/passages?topicId=${topicId}`);
      if (res.ok) {
        const data = await res.json();
        setPassages(data.passages || []);
      }
    } catch {
      setPassages([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setError("");
    setSaving(true);

    try {
      const payload = {
        ...formData,
        passageId: formData.passageId || undefined,
        patternTypeId: formData.patternTypeId || undefined,
        subtopic: formData.subtopic || undefined,
        detailedSolution: formData.detailedSolution || undefined,
        optionAExplanation: formData.optionAExplanation || undefined,
        optionBExplanation: formData.optionBExplanation || undefined,
        optionCExplanation: formData.optionCExplanation || undefined,
        optionDExplanation: formData.optionDExplanation || undefined,
        sourceYear: formData.sourceYear || undefined,
      };

      const res = await fetch(`/api/admin/questions/${questionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update question");
      }

      router.push("/admin/questions");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/questions/${questionId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to archive question");
      }

      router.push("/admin/questions");
    } catch (err: any) {
      setError(err.message);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="max-w-4xl">
        <p className="text-sm" style={{ color: "var(--status-wrong)" }}>
          Question not found
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/questions"
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          ← Back to Questions
        </Link>
      </div>

      <h1 className="text-page-title mb-6" style={{ color: "var(--text-primary)" }}>
        Edit Question
      </h1>

      {error && (
        <div
          className="rounded-lg p-4 mb-6"
          style={{
            backgroundColor: "var(--status-wrong)",
            border: "1px solid var(--status-wrong)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--bg-primary)" }}>
            {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-xl p-5 mb-6"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          <h2
            className="text-section-header mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Basic Info
          </h2>

          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Topic *
              </label>
              <select
                required
                value={formData.topicId}
                onChange={(e) =>
                  setFormData({ ...formData, topicId: e.target.value, patternTypeId: null, passageId: null })
                }
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                style={{ borderColor: "var(--border-default)" }}
              >
                <option value="">Select a topic</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name} ({topic.section.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Pattern Type
              </label>
              <select
                value={formData.patternTypeId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, patternTypeId: e.target.value || null })
                }
                disabled={!formData.topicId || patternTypes.length === 0}
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none disabled:opacity-50"
                style={{ borderColor: "var(--border-default)" }}
              >
                <option value="">None</option>
                {patternTypes.map((pattern) => (
                  <option key={pattern.id} value={pattern.id}>
                    {pattern.name}
                  </option>
                ))}
              </select>
              {formData.topicId && patternTypes.length === 0 && (
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                  No pattern types available for this topic
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Passage (optional, for RC questions)
              </label>
              <select
                value={formData.passageId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, passageId: e.target.value || null })
                }
                disabled={!formData.topicId || passages.length === 0}
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none disabled:opacity-50"
                style={{ borderColor: "var(--border-default)" }}
              >
                <option value="">None</option>
                {passages.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Subtopic
              </label>
              <input
                type="text"
                value={formData.subtopic || ""}
                onChange={(e) =>
                  setFormData({ ...formData, subtopic: e.target.value || null })
                }
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                style={{ borderColor: "var(--border-default)" }}
                placeholder="e.g., Compound Interest"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Difficulty *
                </label>
                <select
                  required
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      difficulty: e.target.value as "l1" | "l2" | "l3",
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <option value="l1">L1 - Foundation</option>
                  <option value="l2">L2 - Intermediate</option>
                  <option value="l3">L3 - UPSC</option>
                </select>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Language *
                </label>
                <select
                  required
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      language: e.target.value as "en" | "hi",
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-5 mb-6"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          <h2
            className="text-section-header mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Question
          </h2>

          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Question Text *
              </label>
              <textarea
                required
                value={formData.questionText}
                onChange={(e) =>
                  setFormData({ ...formData, questionText: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none min-h-[120px]"
                style={{ borderColor: "var(--border-default)" }}
                placeholder="Enter the question text (supports markdown)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Option A *
                </label>
                <input
                  type="text"
                  required
                  value={formData.optionA}
                  onChange={(e) =>
                    setFormData({ ...formData, optionA: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-default)" }}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Option B *
                </label>
                <input
                  type="text"
                  required
                  value={formData.optionB}
                  onChange={(e) =>
                    setFormData({ ...formData, optionB: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-default)" }}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Option C *
                </label>
                <input
                  type="text"
                  required
                  value={formData.optionC}
                  onChange={(e) =>
                    setFormData({ ...formData, optionC: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-default)" }}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Option D *
                </label>
                <input
                  type="text"
                  required
                  value={formData.optionD}
                  onChange={(e) =>
                    setFormData({ ...formData, optionD: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-default)" }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Correct Option *
              </label>
              <div className="flex gap-4">
                {(["a", "b", "c", "d"] as const).map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="correctOption"
                      value={option}
                      checked={formData.correctOption === option}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          correctOption: e.target.value as "a" | "b" | "c" | "d",
                        })
                      }
                      className="cursor-pointer"
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Option {option.toUpperCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-5 mb-6"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          <h2
            className="text-section-header mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Solutions
          </h2>

          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Smart Solution (shortcut approach) *
              </label>
              <textarea
                required
                value={formData.smartSolution}
                onChange={(e) =>
                  setFormData({ ...formData, smartSolution: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none min-h-[100px]"
                style={{ borderColor: "var(--border-default)" }}
                placeholder="The intuitive, quick approach to solve this question"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Detailed Solution
              </label>
              <textarea
                value={formData.detailedSolution || ""}
                onChange={(e) =>
                  setFormData({ ...formData, detailedSolution: e.target.value || null })
                }
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none min-h-[100px]"
                style={{ borderColor: "var(--border-default)" }}
                placeholder="Step-by-step formula-based approach (optional)"
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-5 mb-6"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2
              className="text-section-header"
              style={{ color: "var(--text-primary)" }}
            >
              Option Explanations
            </h2>
            <button
              type="button"
              onClick={() => setShowOptionExplanations(!showOptionExplanations)}
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {showOptionExplanations ? "Hide" : "Show"}
            </button>
          </div>

          {showOptionExplanations && (
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Option A Explanation
                </label>
                <input
                  type="text"
                  value={formData.optionAExplanation || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      optionAExplanation: e.target.value || null,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-default)" }}
                  placeholder="Why this option is correct/incorrect"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Option B Explanation
                </label>
                <input
                  type="text"
                  value={formData.optionBExplanation || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      optionBExplanation: e.target.value || null,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-default)" }}
                  placeholder="Why this option is correct/incorrect"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Option C Explanation
                </label>
                <input
                  type="text"
                  value={formData.optionCExplanation || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      optionCExplanation: e.target.value || null,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-default)" }}
                  placeholder="Why this option is correct/incorrect"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Option D Explanation
                </label>
                <input
                  type="text"
                  value={formData.optionDExplanation || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      optionDExplanation: e.target.value || null,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-default)" }}
                  placeholder="Why this option is correct/incorrect"
                />
              </div>
            </div>
          )}
        </div>

        <div
          className="rounded-xl p-5 mb-6"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          <h2
            className="text-section-header mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Source
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Source Type *
              </label>
              <select
                required
                value={formData.sourceType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sourceType: e.target.value as "custom" | "pyq" | "cat" | "ai",
                  })
                }
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                style={{ borderColor: "var(--border-default)" }}
              >
                <option value="custom">Custom</option>
                <option value="pyq">PYQ (Previous Year)</option>
                <option value="cat">CAT</option>
                <option value="ai">AI Generated</option>
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Source Year
              </label>
              <input
                type="number"
                value={formData.sourceYear || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sourceYear: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                style={{ borderColor: "var(--border-default)" }}
                placeholder="e.g., 2023"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: "var(--text-primary)",
                color: "var(--bg-primary)",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <Link
              href="/admin/questions"
              className="px-6 py-2 rounded-lg text-sm font-medium border"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-2 rounded-lg text-sm font-medium border"
            style={{
              borderColor: "var(--status-wrong)",
              color: "var(--status-wrong)",
            }}
          >
            Archive Question
          </button>
        </div>
      </form>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="rounded-xl p-6 max-w-md"
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-default)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-section-header mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Archive Question
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              Are you sure you want to archive this question? It will no longer appear in
              practice sessions but will remain in the database.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border"
                style={{
                  borderColor: "var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: "var(--status-wrong)",
                  color: "var(--bg-primary)",
                }}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
