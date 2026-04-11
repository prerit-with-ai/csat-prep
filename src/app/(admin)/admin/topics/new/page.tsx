"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewTopicPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [section, setSection] = useState("rc");
  const [status, setStatus] = useState("draft");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [cheatsheet, setCheatsheet] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          section,
          status,
          displayOrder,
          cheatsheet: cheatsheet || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || "Failed to create topic");
        setIsSubmitting(false);
        return;
      }

      // Redirect to edit page
      window.location.href = `/admin/topics/${data.topic.id}`;
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/topics"
          className="text-sm font-medium inline-flex items-center gap-1"
          style={{ color: "var(--text-secondary)" }}
        >
          ← Topics
        </Link>
      </div>

      <h1
        className="text-2xl font-semibold mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        New Topic
      </h1>

      <div
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-default)",
        }}
        className="rounded-xl p-5"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Name <span style={{ color: "var(--color-wrong)" }}>*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{
                  borderColor: "var(--border-default)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--text-secondary)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-default)";
                }}
              />
            </div>

            {/* Slug */}
            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Slug <span style={{ color: "var(--color-wrong)" }}>*</span>
              </label>
              <input
                type="text"
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{
                  borderColor: "var(--border-default)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--text-secondary)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-default)";
                }}
              />
            </div>

            {/* Section */}
            <div>
              <label
                htmlFor="section"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Section <span style={{ color: "var(--color-wrong)" }}>*</span>
              </label>
              <select
                id="section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{
                  borderColor: "var(--border-default)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--text-secondary)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-default)";
                }}
              >
                <option value="rc">RC (Reading Comprehension)</option>
                <option value="lr">LR (Logical Reasoning)</option>
                <option value="math">Math</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{
                  borderColor: "var(--border-default)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--text-secondary)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-default)";
                }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* Display Order */}
            <div>
              <label
                htmlFor="displayOrder"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Display Order
              </label>
              <input
                type="number"
                id="displayOrder"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{
                  borderColor: "var(--border-default)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--text-secondary)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-default)";
                }}
              />
            </div>

            {/* Cheatsheet */}
            <div>
              <label
                htmlFor="cheatsheet"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Cheatsheet
              </label>
              <textarea
                id="cheatsheet"
                value={cheatsheet}
                onChange={(e) => setCheatsheet(e.target.value)}
                placeholder="Markdown + KaTeX supported"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none font-mono min-h-[300px]"
                style={{
                  borderColor: "var(--border-default)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--text-secondary)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-default)";
                }}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--color-wrong-bg)",
                  color: "var(--color-wrong)",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Topic"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
