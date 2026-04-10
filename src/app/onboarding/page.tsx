"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ─── Screen visuals ─────────────────────────────────────────────────────── */

function VisualCSAT() {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {/* Top row — 3 stats */}
      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 360 }}>
        {[
          { num: "80", label: "Questions", bg: "var(--section-rc-bg)", accent: "var(--section-rc)" },
          { num: "2h", label: "Time limit", bg: "var(--section-lr-bg)", accent: "var(--section-lr)" },
          { num: "200", label: "Total marks", bg: "var(--section-math-bg)", accent: "var(--section-math)" },
        ].map((s) => (
          <div
            key={s.num}
            style={{
              flex: 1,
              borderRadius: 16,
              padding: "20px 8px",
              backgroundColor: s.bg,
              border: `1.5px solid ${s.accent}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 800, color: s.accent, lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontSize: 11, color: s.accent, marginTop: 6, fontWeight: 600, opacity: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {/* Qualifying bar */}
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          borderRadius: 12,
          padding: "14px 20px",
          backgroundColor: "var(--color-correct-bg)",
          border: "1.5px solid var(--color-correct)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--color-correct)", fontWeight: 600 }}>
          To qualify
        </span>
        <span style={{ fontSize: 26, fontWeight: 800, color: "var(--color-correct)" }}>
          66 / 200
        </span>
      </div>
    </div>
  );
}

function VisualSections() {
  const sections = [
    {
      code: "RC",
      name: "Reading\nComprehension",
      patterns: ["Passage inference", "Author's tone", "Vocab in context"],
      bg: "var(--section-rc-bg)",
      accent: "var(--section-rc)",
    },
    {
      code: "LR",
      name: "Logical\nReasoning",
      patterns: ["Syllogisms", "Sequences", "Blood relations"],
      bg: "var(--section-lr-bg)",
      accent: "var(--section-lr)",
    },
    {
      code: "MATH",
      name: "Mathematics",
      patterns: ["Percentages", "Time & work", "Data interpretation"],
      bg: "var(--section-math-bg)",
      accent: "var(--section-math)",
    },
  ];

  return (
    <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 380, alignItems: "stretch" }}>
      {sections.map((s) => (
        <div
          key={s.code}
          style={{
            flex: 1,
            borderRadius: 16,
            padding: "16px 10px",
            backgroundColor: s.bg,
            border: `1.5px solid ${s.accent}`,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: s.accent, letterSpacing: "0.05em" }}>
            {s.code}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            {s.patterns.map((p) => (
              <div
                key={p}
                style={{
                  fontSize: 10,
                  color: s.accent,
                  backgroundColor: "rgba(255,255,255,0.5)",
                  borderRadius: 6,
                  padding: "4px 6px",
                  fontWeight: 500,
                  lineHeight: 1.3,
                }}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function VisualLearningFlow() {
  const steps = [
    { icon: "◈", label: "Read cheatsheet", sub: "Core concepts, shortcuts", color: "var(--section-lr)" },
    { icon: "◉", label: "Practice", sub: "L1 → L2 → L3", color: "var(--section-math)" },
    { icon: "◆", label: "Progress", sub: "Topic turns green", color: "var(--color-correct)" },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 360 }}>
      {steps.map((s, i) => (
        <div key={s.label} style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
          {/* Step card */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                borderRadius: 14,
                padding: "16px 16px",
                backgroundColor: "var(--bg-primary)",
                border: `1.5px solid var(--border-default)`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: `color-mix(in srgb, ${s.color} 15%, transparent)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  color: s.color,
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{s.sub}</div>
              </div>
            </div>
          </div>

          {/* Connector */}
          {i < steps.length - 1 && (
            <div style={{ width: 24, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }}>
              <div style={{ width: 1, height: 16, backgroundColor: "var(--border-default)" }} />
            </div>
          )}
        </div>
      ))}
      {/* Fake step connector — vertical */}
    </div>
  );
}

function VisualABC() {
  const tags = [
    {
      tag: "A",
      hindi: "Ab Karo",
      english: "I've got this",
      color: "var(--color-correct)",
      bg: "var(--color-correct-bg)",
    },
    {
      tag: "B",
      hindi: "Baad mein",
      english: "Come back",
      color: "var(--color-amber)",
      bg: "var(--color-amber-bg)",
    },
    {
      tag: "C",
      hindi: "Chorh Do",
      english: "Skip it",
      color: "var(--color-wrong)",
      bg: "var(--color-wrong-bg)",
    },
  ];

  return (
    <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 360 }}>
      {tags.map((t) => (
        <div
          key={t.tag}
          style={{
            flex: 1,
            borderRadius: 16,
            padding: "24px 10px 20px",
            backgroundColor: t.bg,
            border: `2px solid ${t.color}`,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: t.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            {t.tag}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.hindi}</div>
          <div style={{ fontSize: 11, color: t.color, opacity: 0.75, fontWeight: 500 }}>{t.english}</div>
        </div>
      ))}
    </div>
  );
}

function VisualMock() {
  return (
    <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Timer bar */}
      <div
        style={{
          borderRadius: 12,
          padding: "12px 16px",
          backgroundColor: "var(--bg-primary)",
          border: "1.5px solid var(--border-default)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>First pass</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>12 / 80</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--color-amber)", fontVariantNumeric: "tabular-nums" }}>
          ⏱ 1:38:44
        </span>
      </div>

      {/* Navigator dots */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {Array.from({ length: 18 }).map((_, i) => {
          const color = i < 4 ? "var(--color-correct)" : i < 7 ? "var(--color-amber)" : i < 9 ? "var(--color-wrong)" : "var(--border-default)";
          return (
            <div
              key={i}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: `2px solid ${i === 11 ? "var(--text-primary)" : color}`,
                backgroundColor: i < 9 ? color : "transparent",
                fontSize: 9,
                fontWeight: 700,
                color: i < 9 ? "#fff" : "var(--text-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      {/* ABC buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { tag: "A", label: "Ab Karo", color: "var(--color-correct)", selected: true },
          { tag: "B", label: "Baad mein", color: "var(--color-amber)", selected: false },
          { tag: "C", label: "Chorh Do", color: "var(--color-wrong)", selected: false },
        ].map((btn) => (
          <div
            key={btn.tag}
            style={{
              flex: 1,
              borderRadius: 10,
              padding: "10px 4px",
              border: `2px solid ${btn.selected ? btn.color : "var(--border-default)"}`,
              backgroundColor: btn.selected ? btn.color : "transparent",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: btn.selected ? "#fff" : "var(--text-secondary)" }}>
              {btn.tag}
            </div>
            <div style={{ fontSize: 9, color: btn.selected ? "rgba(255,255,255,0.8)" : "var(--text-tertiary)", marginTop: 2 }}>
              {btn.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisualRevision() {
  const patterns = [
    { name: "Successive percentage", section: "math", due: "Due today", accent: "var(--section-math)", bg: "var(--section-math-bg)" },
    { name: "Syllogism — all/some/no", section: "lr", due: "Due today", accent: "var(--section-lr)", bg: "var(--section-lr-bg)" },
    { name: "Author's intent", section: "rc", due: "Tomorrow", accent: "var(--section-rc)", bg: "var(--section-rc-bg)" },
    { name: "Time & work — LCM method", section: "math", due: "In 3 days", accent: "var(--section-math)", bg: "var(--section-math-bg)" },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 8 }}>
      {patterns.map((p, i) => (
        <div
          key={p.name}
          style={{
            borderRadius: 12,
            padding: "11px 14px",
            backgroundColor: i < 2 ? p.bg : "var(--bg-primary)",
            border: `1.5px solid ${i < 2 ? p.accent : "var(--border-subtle)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            opacity: i >= 2 ? 0.55 : 1,
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: i < 2 ? p.accent : "var(--text-primary)" }}>
              {p.name}
            </div>
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: i < 2 ? p.accent : "var(--text-tertiary)",
              whiteSpace: "nowrap",
              backgroundColor: i < 2 ? "rgba(255,255,255,0.5)" : "transparent",
              borderRadius: 6,
              padding: i < 2 ? "3px 7px" : "0",
            }}
          >
            {p.due}
          </div>
        </div>
      ))}
    </div>
  );
}

function VisualReady() {
  return (
    <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {/* Three section bars filling up */}
      {[
        { label: "Reading Comprehension", accent: "var(--section-rc)", bg: "var(--section-rc-bg)", pct: 100 },
        { label: "Logical Reasoning", accent: "var(--section-lr)", bg: "var(--section-lr-bg)", pct: 100 },
        { label: "Mathematics", accent: "var(--section-math)", bg: "var(--section-math-bg)", pct: 100 },
      ].map((s) => (
        <div key={s.label} style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: s.accent }}>{s.label}</span>
            <span style={{ fontSize: 11, color: s.accent }}>Ready</span>
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 6,
              backgroundColor: s.bg,
              border: `1px solid ${s.accent}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${s.pct}%`,
                backgroundColor: s.accent,
                borderRadius: 6,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Screen definitions ─────────────────────────────────────────────────── */

const SCREENS = [
  {
    visual: <VisualCSAT />,
    title: "Meet CSAT",
    body: "Paper 2 of UPSC Prelims. 80 questions in 2 hours. You need 66 out of 200 to qualify — that's a 33% bar. CSAT Cracker exists to make sure you sail past it without the stress.",
  },
  {
    visual: <VisualSections />,
    title: "Three arenas to master",
    body: "Reading Comprehension, Logical Reasoning, and Mathematics. Each section has topics, and every topic has specific question patterns that repeat year after year. Learn the patterns, crack the paper.",
  },
  {
    visual: <VisualLearningFlow />,
    title: "Learn → Practice → Level up",
    body: "Every topic comes with a cheatsheet — the core concepts and shortcuts in one place. Read it, then practice questions. The system levels you up from Foundation (L1) to UPSC-level (L3) automatically.",
  },
  {
    visual: <VisualABC />,
    title: "The ABC Method",
    body: "This is the heart of the app. Every question you see gets a tag. A if you're confident and answering now. B to come back later. C to skip entirely. We track your C→B→A shifts — that's your real growth.",
  },
  {
    visual: <VisualMock />,
    title: "Mock tests that train your instincts",
    body: "Full timed tests with all 80 questions under real exam conditions. ABC-tag as you go. After submitting, see your score, section breakdown, time per question, and how your confidence held up.",
  },
  {
    visual: <VisualRevision />,
    title: "The app remembers what you forget",
    body: "Questions you tagged C or got wrong resurface automatically, spaced over time. Your daily dose keeps all three sections active — a focused set every day so nothing slips through the cracks.",
  },
  {
    visual: <VisualReady />,
    title: "You're all set",
    body: "Head to Topics, pick a section you're curious about, read the cheatsheet, and do your first practice session. The app will guide everything from there.",
  },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const router = useRouter();

  const isLast = step === SCREENS.length - 1;
  const screen = SCREENS[step];
  const progress = ((step + 1) / SCREENS.length) * 100;

  function advance() {
    if (isLast) {
      router.push("/topics");
    } else {
      setStep((s) => s + 1);
      setAnimKey((k) => k + 1);
    }
  }

  return (
    <div
      style={{
        minHeight: "100svh",
        backgroundColor: "var(--bg-secondary)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div style={{ height: 4, backgroundColor: "var(--border-subtle)", flexShrink: 0 }}>
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            backgroundColor: "var(--text-primary)",
            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* ── Wordmark ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
          }}
        >
          CSAT Cracker
        </span>
      </div>

      {/* ── Animated screen ──────────────────────────────────────────────── */}
      <div
        key={animKey}
        className="onboard-enter"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: 480,
          width: "100%",
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        {/* Visual */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 24,
            paddingBottom: 16,
          }}
        >
          {screen.visual}
        </div>

        {/* Text */}
        <div style={{ paddingBottom: 8 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginBottom: 10,
            }}
          >
            {step + 1} of {SCREENS.length}
          </p>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "var(--text-primary)",
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            {screen.title}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              lineHeight: 1.7,
            }}
          >
            {screen.body}
          </p>
        </div>

        {/* CTA */}
        <div style={{ paddingTop: 20, paddingBottom: 12 }}>
          <button
            onClick={advance}
            style={{
              width: "100%",
              padding: "14px 24px",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-primary)",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.01em",
            }}
          >
            {isLast ? "Take me to Topics →" : "Next →"}
          </button>
        </div>

        {/* Dot indicators */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            paddingBottom: 28,
          }}
        >
          {SCREENS.map((_, i) => (
            <div
              key={i}
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: i === step ? "var(--text-primary)" : "var(--border-default)",
                width: i === step ? 22 : 6,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
