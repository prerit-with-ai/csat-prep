"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [examDate, setExamDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.examDate) {
          // Format as YYYY-MM-DD for the date input
          setExamDate(new Date(data.examDate).toISOString().slice(0, 10));
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examDate: examDate || null }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examDate: null }),
    });
    setExamDate("");
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-page-title mb-1">Settings</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-tertiary)" }}>
        Manage your exam preparation preferences.
      </p>

      <div
        className="rounded-xl p-5"
        style={{ border: "1px solid var(--border-default)" }}
      >
        <h2 className="text-section mb-1">Exam Date</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
          Set your CSAT exam date to see a countdown on your dashboard.
        </p>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label
              className="block text-sm mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
                outline: "none",
              }}
            />
          </div>

          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || !examDate}
          >
            {saving ? "Saving…" : saved ? "Saved" : "Save"}
          </Button>
        </div>

        {examDate && (
          <button
            onClick={handleClear}
            disabled={saving}
            className="mt-3 text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            Clear date
          </button>
        )}
      </div>
    </div>
  );
}
