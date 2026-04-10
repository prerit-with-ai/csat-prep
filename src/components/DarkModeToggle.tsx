"use client";

import { useEffect } from "react";

export function DarkModeToggle() {
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="text-sm leading-none"
      style={{ color: "var(--text-tertiary)" }}
    >
      ◐
    </button>
  );
}
