"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type NeedsHelpFlag = {
  id: string;
  userId: string;
  topicId: string;
  topicName: string;
  topicSection: string;
  status: string;
  currentLevel: string;
  l1Attempts: number;
  l1Correct: number;
  adminNotes: string | null;
  needsHelp: boolean;
  updatedAt: string;
  userName: string;
  userEmail: string;
};

type PersistentItem = {
  id: string;
  userId: string;
  patternTypeId: string;
  patternName: string;
  wrongCount: number;
  reviewCount: number;
  status: string;
  createdAt: string;
  lastReviewedAt: string | null;
  userName: string;
  userEmail: string;
};

type FlagsData = {
  needsHelpFlags: NeedsHelpFlag[];
  persistentItems: PersistentItem[];
};

export default function AdminFlagsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FlagsData | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});
  const [resolving, setResolving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const res = await fetch("/api/admin/flags");
      if (!res.ok) throw new Error("Failed to fetch flags");
      const json = await res.json();
      setData(json);
      // Initialize editing notes with current values
      const notes: Record<string, string> = {};
      json.needsHelpFlags.forEach((flag: NeedsHelpFlag) => {
        notes[flag.id] = flag.adminNotes || "";
      });
      setEditingNotes(notes);
    } catch (error) {
      console.error("Error fetching flags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async (flagId: string) => {
    setSavingNotes((prev) => ({ ...prev, [flagId]: true }));
    try {
      const res = await fetch(`/api/admin/flags/${flagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: editingNotes[flagId] }),
      });
      if (!res.ok) throw new Error("Failed to save notes");
      // Update local state
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          needsHelpFlags: prev.needsHelpFlags.map((flag) =>
            flag.id === flagId
              ? { ...flag, adminNotes: editingNotes[flagId] }
              : flag
          ),
        };
      });
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Failed to save notes");
    } finally {
      setSavingNotes((prev) => ({ ...prev, [flagId]: false }));
    }
  };

  const handleResolve = async (flagId: string) => {
    setResolving((prev) => ({ ...prev, [flagId]: true }));
    try {
      const res = await fetch(`/api/admin/flags/${flagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ needsHelp: false }),
      });
      if (!res.ok) throw new Error("Failed to resolve flag");
      // Remove from local state
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          needsHelpFlags: prev.needsHelpFlags.filter(
            (flag) => flag.id !== flagId
          ),
        };
      });
      // Clean up editing state
      setEditingNotes((prev) => {
        const updated = { ...prev };
        delete updated[flagId];
        return updated;
      });
    } catch (error) {
      console.error("Error resolving flag:", error);
      alert("Failed to resolve flag");
    } finally {
      setResolving((prev) => ({ ...prev, [flagId]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 15, color: "var(--color-wrong)" }}>
          Failed to load flags data
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 32,
        }}
      >
        Student Flags
      </h1>

      {/* Needs Help Section */}
      <section style={{ marginBottom: 48 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 16,
          }}
        >
          Needs Help
        </h2>
        {data.needsHelpFlags.length === 0 ? (
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            No students currently need help.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.needsHelpFlags.map((flag) => {
              const accuracy =
                flag.l1Attempts > 0
                  ? Math.round((flag.l1Correct / flag.l1Attempts) * 100)
                  : 0;
              return (
                <div
                  key={flag.id}
                  style={{
                    border: "1px solid var(--border-default)",
                    borderRadius: 12,
                    padding: "20px 16px",
                    backgroundColor: "var(--bg-primary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          marginBottom: 4,
                        }}
                      >
                        {flag.userName}
                      </h3>
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--text-secondary)",
                          marginBottom: 8,
                        }}
                      >
                        {flag.userEmail}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResolve(flag.id)}
                        disabled={resolving[flag.id]}
                      >
                        {resolving[flag.id] ? "Resolving..." : "Resolve"}
                      </Button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Topic
                        </span>
                        <p
                          style={{
                            fontSize: 15,
                            color: "var(--text-primary)",
                            marginTop: 2,
                          }}
                        >
                          {flag.topicName}
                        </p>
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Section
                        </span>
                        <p
                          style={{
                            fontSize: 15,
                            color: "var(--text-primary)",
                            marginTop: 2,
                          }}
                        >
                          {flag.topicSection}
                        </p>
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Level
                        </span>
                        <p
                          style={{
                            fontSize: 15,
                            color: "var(--text-primary)",
                            marginTop: 2,
                          }}
                        >
                          {flag.currentLevel}
                        </p>
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          L1 Accuracy
                        </span>
                        <p
                          style={{
                            fontSize: 15,
                            color:
                              accuracy < 50
                                ? "var(--color-wrong)"
                                : accuracy < 70
                                  ? "var(--color-amber)"
                                  : "var(--color-correct)",
                            marginTop: 2,
                            fontWeight: 600,
                          }}
                        >
                          {accuracy}% ({flag.l1Correct}/{flag.l1Attempts})
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        color: "var(--text-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: 6,
                      }}
                    >
                      Admin Notes
                    </label>
                    <textarea
                      value={editingNotes[flag.id] || ""}
                      onChange={(e) =>
                        setEditingNotes((prev) => ({
                          ...prev,
                          [flag.id]: e.target.value,
                        }))
                      }
                      rows={2}
                      style={{
                        width: "100%",
                        border: "1px solid var(--border-default)",
                        borderRadius: 8,
                        padding: 8,
                        fontSize: 13,
                        backgroundColor: "var(--bg-primary)",
                        color: "var(--text-primary)",
                        resize: "vertical",
                        fontFamily: "inherit",
                      }}
                      placeholder="Add notes about this student's progress or intervention needed..."
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveNotes(flag.id)}
                      disabled={
                        savingNotes[flag.id] ||
                        editingNotes[flag.id] === flag.adminNotes
                      }
                      className="mt-2"
                    >
                      {savingNotes[flag.id] ? "Saving..." : "Save Notes"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Persistent Weaknesses Section */}
      <section>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 16,
          }}
        >
          Persistent Weaknesses
        </h2>
        {data.persistentItems.length === 0 ? (
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            No persistent weaknesses detected.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.persistentItems.map((item) => {
              const lastReviewed = item.lastReviewedAt
                ? new Date(item.lastReviewedAt).toLocaleDateString()
                : "Never";
              return (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid var(--border-default)",
                    borderRadius: 12,
                    padding: "20px 16px",
                    backgroundColor: "var(--bg-primary)",
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      {item.userName}
                    </h3>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {item.userEmail}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Pattern
                      </span>
                      <p
                        style={{
                          fontSize: 15,
                          color: "var(--text-primary)",
                          marginTop: 2,
                        }}
                      >
                        {item.patternName}
                      </p>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Wrong Count
                      </span>
                      <p
                        style={{
                          fontSize: 15,
                          color: "var(--color-wrong)",
                          marginTop: 2,
                          fontWeight: 600,
                        }}
                      >
                        {item.wrongCount}
                      </p>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Review Count
                      </span>
                      <p
                        style={{
                          fontSize: 15,
                          color: "var(--text-primary)",
                          marginTop: 2,
                        }}
                      >
                        {item.reviewCount}
                      </p>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Last Reviewed
                      </span>
                      <p
                        style={{
                          fontSize: 15,
                          color: "var(--text-primary)",
                          marginTop: 2,
                        }}
                      >
                        {lastReviewed}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
