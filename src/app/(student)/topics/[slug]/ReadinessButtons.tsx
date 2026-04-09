"use client";

import { useState } from "react";

interface ReadinessButtonsProps {
  slug: string;
  initialNeedsHelp: boolean;
  hasProgress: boolean;
}

export function ReadinessButtons({
  slug,
  initialNeedsHelp,
  hasProgress,
}: ReadinessButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [needsHelp, setNeedsHelp] = useState(initialNeedsHelp);

  const handleReady = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/topics/${slug}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to update progress");
      }

      // Navigate to practice page (will be built in Slice 3)
      // For now, redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error updating progress:", error);
      setMessage("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleNotReady = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/topics/${slug}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ needsHelp: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to update progress");
      }

      setNeedsHelp(true);
      setMessage("Noted — keep reviewing!");
      setIsLoading(false);
    } catch (error) {
      console.error("Error updating progress:", error);
      setMessage("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleReady}
          disabled={isLoading}
          style={{
            backgroundColor: "var(--text-primary)",
            color: "var(--bg-primary)",
            border: "1px solid var(--text-primary)",
          }}
          className="px-4 py-2 rounded-lg font-medium text-body hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Loading..." : "Ready to practice"}
        </button>
        <button
          onClick={handleNotReady}
          disabled={isLoading}
          style={{
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
          }}
          className="px-4 py-2 rounded-lg font-medium text-body hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Loading..." : "Not ready yet"}
        </button>
      </div>

      {message && (
        <p
          className="text-sm mt-3"
          style={{
            color: message.includes("wrong")
              ? "var(--color-wrong)"
              : "var(--color-correct)",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
