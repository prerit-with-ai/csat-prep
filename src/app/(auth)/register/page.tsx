"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await authClient.signUp.email({ email, password, name });

    if (authError) {
      setError(authError.message ?? "Registration failed");
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-secondary)" }}
    >
      <div className="w-full" style={{ maxWidth: "360px" }}>
        {/* Header */}
        <div className="mb-8">
          <p
            className="text-sm font-semibold uppercase mb-6"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.1em" }}
          >
            CSAT Cracker
          </p>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Create account
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Start your CSAT preparation
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
              />
            </div>

            {error && (
              <p className="text-sm" style={{ color: "var(--color-wrong)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50 mt-2"
              style={{
                backgroundColor: "var(--text-primary)",
                color: "var(--bg-primary)",
              }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-sm text-center mt-4" style={{ color: "var(--text-tertiary)" }}>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium underline"
            style={{ color: "var(--text-primary)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
