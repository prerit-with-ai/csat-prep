"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

// ============================================
// Topic Info Editor
// ============================================

interface TopicInfoEditorProps {
  topic: {
    id: string;
    name: string;
    slug: string;
    section: string;
    status: string;
    displayOrder: number;
  };
}

export function TopicInfoEditor({ topic }: TopicInfoEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: topic.name,
    section: topic.section,
    status: topic.status,
    displayOrder: topic.displayOrder,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/topics/${topic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save");
      }
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle = {
    borderColor: "var(--border-default)",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
  };

  if (!isEditing) {
    return (
      <div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Name</p>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{topic.name}</p>
          </div>
          <div>
            <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Section</p>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{topic.section.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Status</p>
            <p className="text-sm font-medium" style={{ color: topic.status === "published" ? "var(--color-correct)" : "var(--color-amber)" }}>
              {topic.status === "published" ? "Published" : "Draft"}
            </p>
          </div>
          <div>
            <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Slug</p>
            <p className="text-sm font-mono" style={{ color: "var(--text-tertiary)" }}>{topic.slug}</p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-primary)" }}
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Section</label>
          <select
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
          >
            <option value="rc">RC</option>
            <option value="lr">LR</option>
            <option value="math">Math</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Display Order</label>
          <input
            type="number"
            value={form.displayOrder}
            onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
      </div>
      {error && <p className="text-sm" style={{ color: "var(--color-wrong)" }}>{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-primary)", opacity: isSaving ? 0.5 : 1 }}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => { setIsEditing(false); setForm({ name: topic.name, section: topic.section, status: topic.status, displayOrder: topic.displayOrder }); setError(""); }}
          disabled={isSaving}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ============================================
// Cheatsheet Editor
// ============================================

interface CheatsheetEditorProps {
  topicId: string;
  initialContent: string;
}

export function CheatsheetEditor({ topicId, initialContent }: CheatsheetEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [draftContent, setDraftContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/topics/${topicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cheatsheet: draftContent }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to save cheatsheet");
      }

      setContent(draftContent);
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftContent(content);
    setIsEditing(false);
    setError("");
  };

  if (!isEditing) {
    return (
      <div>
        {content ? (
          <MarkdownRenderer content={content} />
        ) : (
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            No cheatsheet content yet. Click Edit to add content.
          </p>
        )}
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: "var(--text-primary)",
            color: "var(--bg-primary)",
          }}
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div>
      <textarea
        value={draftContent}
        onChange={(e) => setDraftContent(e.target.value)}
        rows={15}
        className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none mb-3 font-mono"
        style={{ borderColor: "var(--border-default)" }}
        placeholder="Enter cheatsheet content in Markdown format..."
      />
      {error && (
        <p className="text-sm mb-3" style={{ color: "var(--status-wrong)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: "var(--text-primary)",
            color: "var(--bg-primary)",
            opacity: isSaving ? 0.5 : 1,
          }}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ============================================
// Pattern Manager
// ============================================

interface PatternType {
  id: string;
  topicId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  createdAt: Date;
}

interface PatternManagerProps {
  topicId: string;
  initialPatterns: PatternType[];
}

export function PatternManager({ topicId, initialPatterns }: PatternManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPattern, setNewPattern] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAdd = async () => {
    if (!newPattern.name.trim()) {
      setError("Pattern name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          name: newPattern.name.trim(),
          description: newPattern.description.trim() || undefined,
          displayOrder: initialPatterns.length,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to create pattern");
      }

      setNewPattern({ name: "", description: "" });
      setShowAddForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (patternId: string) => {
    if (!confirm("Are you sure you want to delete this pattern type?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/patterns/${patternId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to delete pattern");
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete pattern");
    }
  };

  return (
    <div>
      {/* Pattern List */}
      {initialPatterns.length === 0 && !showAddForm ? (
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          No pattern types yet. Add your first pattern type below.
        </p>
      ) : (
        <div className="space-y-3 mb-4">
          {initialPatterns.map((pattern) => (
            <div
              key={pattern.id}
              className="rounded-lg p-4"
              style={{
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                    {pattern.name}
                  </h3>
                  {pattern.description && (
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {pattern.description}
                    </p>
                  )}
                  <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                    Order: {pattern.displayOrder}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(pattern.id)}
                  className="px-3 py-1.5 rounded-lg text-sm ml-4"
                  style={{
                    border: "1px solid var(--border-default)",
                    color: "var(--status-wrong)",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showAddForm ? (
        <div
          className="rounded-lg p-4"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
            Add Pattern Type
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm block mb-1" style={{ color: "var(--text-secondary)" }}>
                Name *
              </label>
              <input
                type="text"
                value={newPattern.name}
                onChange={(e) => setNewPattern({ ...newPattern, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                style={{ borderColor: "var(--border-default)" }}
                placeholder="e.g., Basic Percentage"
              />
            </div>
            <div>
              <label className="text-sm block mb-1" style={{ color: "var(--text-secondary)" }}>
                Description
              </label>
              <textarea
                value={newPattern.description}
                onChange={(e) => setNewPattern({ ...newPattern, description: e.target.value })}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                style={{ borderColor: "var(--border-default)" }}
                placeholder="Optional description"
              />
            </div>
            {error && (
              <p className="text-sm" style={{ color: "var(--status-wrong)" }}>
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: "var(--text-primary)",
                  color: "var(--bg-primary)",
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                {isSubmitting ? "Adding..." : "Add Pattern"}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewPattern({ name: "", description: "" });
                  setError("");
                }}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: "var(--text-primary)",
            color: "var(--bg-primary)",
          }}
        >
          Add Pattern Type
        </button>
      )}
    </div>
  );
}

// ============================================
// Formula Card Manager
// ============================================

interface FormulaCard {
  id: string;
  topicId: string;
  content: string;
  displayOrder: number;
}

interface FormulaCardManagerProps {
  topicId: string;
  initialFormulas: FormulaCard[];
}

export function FormulaCardManager({ topicId, initialFormulas }: FormulaCardManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAdd = async () => {
    if (!newContent.trim()) {
      setError("Content is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/formulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          content: newContent.trim(),
          displayOrder: initialFormulas.length,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to create formula card");
      }

      setNewContent("");
      setShowAddForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm("Delete this formula card?")) return;

    try {
      const response = await fetch(`/api/admin/formulas/${cardId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to delete");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete formula card");
    }
  };

  return (
    <div>
      {initialFormulas.length === 0 && !showAddForm ? (
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          No formula cards yet. Add your first formula card below.
        </p>
      ) : (
        <div className="space-y-3 mb-4">
          {initialFormulas.map((card) => (
            <div
              key={card.id}
              className="rounded-lg p-4"
              style={{ border: "1px solid var(--border-default)", backgroundColor: "var(--bg-secondary)" }}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-mono flex-1 whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                  {card.content}
                </p>
                <button
                  onClick={() => handleDelete(card.id)}
                  className="px-3 py-1.5 rounded-lg text-sm ml-4"
                  style={{ border: "1px solid var(--border-default)", color: "var(--color-wrong)" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm ? (
        <div
          className="rounded-lg p-4"
          style={{ border: "1px solid var(--border-default)", backgroundColor: "var(--bg-secondary)" }}
        >
          <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
            Add Formula Card
          </h3>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={6}
            className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none mb-3 font-mono"
            style={{ borderColor: "var(--border-default)" }}
            placeholder="Enter formula in Markdown + KaTeX format..."
          />
          {error && <p className="text-sm mb-3" style={{ color: "var(--color-wrong)" }}>{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-primary)", opacity: isSubmitting ? 0.5 : 1 }}
            >
              {isSubmitting ? "Adding..." : "Add Card"}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewContent(""); setError(""); }}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-primary)" }}
        >
          Add Formula Card
        </button>
      )}
    </div>
  );
}

// ============================================
// Resource Manager
// ============================================

interface Resource {
  id: string;
  topicId: string;
  type: string;
  title: string;
  url: string;
  language: string;
  displayOrder: number;
  createdAt: Date;
}

interface ResourceManagerProps {
  topicId: string;
  initialResources: Resource[];
}

export function ResourceManager({ topicId, initialResources }: ResourceManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newResource, setNewResource] = useState({
    type: "video" as "video" | "pdf" | "article",
    title: "",
    url: "",
    language: "en" as "en" | "hi",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAdd = async () => {
    if (!newResource.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!newResource.url.trim()) {
      setError("URL is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          type: newResource.type,
          title: newResource.title.trim(),
          url: newResource.url.trim(),
          language: newResource.language,
          displayOrder: initialResources.length,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to create resource");
      }

      setNewResource({ type: "video", title: "", url: "", language: "en" });
      setShowAddForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/resources/${resourceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to delete resource");
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete resource");
    }
  };

  const typeLabels: Record<string, string> = {
    video: "Video",
    pdf: "PDF",
    article: "Article",
  };

  const languageLabels: Record<string, string> = {
    en: "English",
    hi: "Hindi",
  };

  return (
    <div>
      {/* Resource List */}
      {initialResources.length === 0 && !showAddForm ? (
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          No resources yet. Add your first resource below.
        </p>
      ) : (
        <div className="space-y-3 mb-4">
          {initialResources.map((resource) => (
            <div
              key={resource.id}
              className="rounded-lg p-4"
              style={{
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {typeLabels[resource.type]}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {languageLabels[resource.language]}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                    {resource.title}
                  </h3>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm break-all"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {resource.url}
                  </a>
                </div>
                <button
                  onClick={() => handleDelete(resource.id)}
                  className="px-3 py-1.5 rounded-lg text-sm ml-4"
                  style={{
                    border: "1px solid var(--border-default)",
                    color: "var(--status-wrong)",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showAddForm ? (
        <div
          className="rounded-lg p-4"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
            Add Resource
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm block mb-1" style={{ color: "var(--text-secondary)" }}>
                Type *
              </label>
              <select
                value={newResource.type}
                onChange={(e) => setNewResource({ ...newResource, type: e.target.value as "video" | "pdf" | "article" })}
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                style={{ borderColor: "var(--border-default)" }}
              >
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="article">Article</option>
              </select>
            </div>
            <div>
              <label className="text-sm block mb-1" style={{ color: "var(--text-secondary)" }}>
                Title *
              </label>
              <input
                type="text"
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                style={{ borderColor: "var(--border-default)" }}
                placeholder="e.g., Percentage Basics by Khan Academy"
              />
            </div>
            <div>
              <label className="text-sm block mb-1" style={{ color: "var(--text-secondary)" }}>
                URL *
              </label>
              <input
                type="url"
                value={newResource.url}
                onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                style={{ borderColor: "var(--border-default)" }}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm block mb-1" style={{ color: "var(--text-secondary)" }}>
                Language *
              </label>
              <select
                value={newResource.language}
                onChange={(e) => setNewResource({ ...newResource, language: e.target.value as "en" | "hi" })}
                className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                style={{ borderColor: "var(--border-default)" }}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            {error && (
              <p className="text-sm" style={{ color: "var(--status-wrong)" }}>
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: "var(--text-primary)",
                  color: "var(--bg-primary)",
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                {isSubmitting ? "Adding..." : "Add Resource"}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewResource({ type: "video", title: "", url: "", language: "en" });
                  setError("");
                }}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: "var(--text-primary)",
            color: "var(--bg-primary)",
          }}
        >
          Add Resource
        </button>
      )}
    </div>
  );
}
