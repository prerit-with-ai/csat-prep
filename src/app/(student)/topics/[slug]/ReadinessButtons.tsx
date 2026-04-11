"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ReadinessButtonsProps {
  slug: string;
}

export function ReadinessButtons({ slug }: ReadinessButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

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
        <Button variant="primary" onClick={handleReady} disabled={isLoading}>
          {isLoading ? "Loading..." : "Ready to practice"}
        </Button>
        <Button variant="secondary" onClick={handleNotReady} disabled={isLoading}>
          {isLoading ? "Loading..." : "Not ready yet"}
        </Button>
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
