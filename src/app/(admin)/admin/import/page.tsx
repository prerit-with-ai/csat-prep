"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

type Step = "input" | "preview" | "done";
type Mode = "csv" | "json";

type PreviewResult = {
  summary: { total: number; valid: number; duplicates: number; invalid: number };
  invalid: Array<{ row: number; data: Record<string, unknown>; reason: string }>;
  duplicates: Array<{ row: number; data: Record<string, unknown> }>;
};

// ── CSV columns (order matters for template) ──────────────────────────────────
const CSV_COLUMNS = [
  "topicSlug",
  "difficulty",
  "questionText",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "correctOption",
  "smartSolution",
  "patternTypeName",
  "detailedSolution",
  "optionAExplanation",
  "optionBExplanation",
  "optionCExplanation",
  "optionDExplanation",
  "sourceType",
  "sourceYear",
] as const;

const CSV_REQUIRED = [
  "topicSlug", "difficulty", "questionText",
  "optionA", "optionB", "optionC", "optionD",
  "correctOption", "smartSolution",
];

const TEMPLATE_ROWS = [
  {
    topicSlug: "percentage",
    difficulty: "l1",
    questionText: "What is 25% of 400?",
    optionA: "100",
    optionB: "75",
    optionC: "50",
    optionD: "125",
    correctOption: "a",
    smartSolution: "25% of 400 = 400/4 = 100",
    patternTypeName: "basic percentage",
    detailedSolution: "To find 25% of 400: 25/100 × 400 = 100",
    optionAExplanation: "",
    optionBExplanation: "",
    optionCExplanation: "",
    optionDExplanation: "",
    sourceType: "custom",
    sourceYear: "",
  },
  {
    topicSlug: "percentage",
    difficulty: "l2",
    questionText: "A price increases by 10% then decreases by 10%. Net change?",
    optionA: "0%",
    optionB: "-1%",
    optionC: "+1%",
    optionD: "-2%",
    correctOption: "b",
    smartSolution: "Net change = -r²/100 = -1%",
    patternTypeName: "successive change",
    detailedSolution: "After 10% up and 10% down: (1.1)(0.9) = 0.99, so -1%",
    optionAExplanation: "",
    optionBExplanation: "",
    optionCExplanation: "",
    optionDExplanation: "",
    sourceType: "pyq",
    sourceYear: "2019",
  },
];

// ── Robust CSV parser (handles quoted fields + embedded newlines) ──────────────
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          // Escaped quote
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field);
        field = "";
        i++;
      } else if (ch === '\r' && text[i + 1] === '\n') {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i += 2;
      } else if (ch === '\n') {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Last field/row
  if (field || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] ?? "").trim();
    });
    return obj;
  });
}

function csvRowsToImportRows(csvRows: Record<string, string>[]): unknown[] {
  return csvRows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const col of CSV_COLUMNS) {
      const val = row[col];
      if (val === undefined || val === "") {
        // Keep optional fields absent rather than empty string
        if (CSV_REQUIRED.includes(col as typeof CSV_REQUIRED[number])) {
          out[col] = "";
        }
        // else omit
      } else if (col === "sourceYear") {
        const n = parseInt(val, 10);
        out[col] = isNaN(n) ? undefined : n;
      } else {
        out[col] = val;
      }
    }
    return out;
  });
}

// ── Template downloads ─────────────────────────────────────────────────────────
function escapeCSVField(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function downloadCSVTemplate() {
  const header = CSV_COLUMNS.join(",");
  const rows = TEMPLATE_ROWS.map((r) =>
    CSV_COLUMNS.map((col) => escapeCSVField(String(r[col] ?? ""))).join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "questions-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSONTemplate() {
  const data = TEMPLATE_ROWS.map(({ sourceYear, ...rest }) => ({
    ...rest,
    sourceYear: sourceYear ? parseInt(sourceYear, 10) : null,
  }));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "questions-template.json";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ImportPage() {
  const [step, setStep] = useState<Step>("input");
  const [mode, setMode] = useState<Mode>("csv");

  // CSV state
  const [csvFileName, setCsvFileName] = useState("");
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvError, setCsvError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // JSON state
  const [jsonInput, setJsonInput] = useState("");

  // Shared
  const [parseError, setParseError] = useState("");
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInvalidRows, setShowInvalidRows] = useState(false);

  // Parsed rows ready to send to API (set on preview)
  const [pendingRows, setPendingRows] = useState<unknown[]>([]);

  // ── CSV file handling ────────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    setCsvError("");
    if (!file.name.endsWith(".csv")) {
      setCsvError("Please upload a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setCsvError("No data rows found. Make sure the file has a header row and at least one data row.");
        return;
      }
      // Validate headers
      const headers = Object.keys(parsed[0]);
      const missing = CSV_REQUIRED.filter((col) => !headers.includes(col));
      if (missing.length > 0) {
        setCsvError(`Missing required columns: ${missing.join(", ")}`);
        return;
      }
      setCsvFileName(file.name);
      setCsvRows(parsed);
    };
    reader.readAsText(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── Preview ──────────────────────────────────────────────────────────────────
  async function handlePreview() {
    setParseError("");

    let rows: unknown[];

    if (mode === "csv") {
      if (csvRows.length === 0) {
        setParseError("No CSV data loaded.");
        return;
      }
      rows = csvRowsToImportRows(csvRows);
    } else {
      try {
        const parsed = JSON.parse(jsonInput);
        if (!Array.isArray(parsed)) {
          setParseError("JSON must be an array of question objects.");
          return;
        }
        rows = parsed;
      } catch {
        setParseError("Invalid JSON. Please check your input.");
        return;
      }
    }

    setPendingRows(rows);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, preview: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        setParseError(err.error?.message || "Failed to preview import.");
        return;
      }
      const data = (await res.json()) as PreviewResult;
      setPreviewResult(data);
      setStep("preview");
    } catch {
      setParseError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Confirm ──────────────────────────────────────────────────────────────────
  async function handleConfirmImport() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: pendingRows, preview: false }),
      });
      if (!res.ok) {
        const err = await res.json();
        setParseError(err.error?.message || "Failed to import questions.");
        setStep("input");
        return;
      }
      const data = await res.json();
      setImportedCount(data.inserted ?? data.created ?? 0);
      setStep("done");
    } catch {
      setParseError("Network error. Please try again.");
      setStep("input");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep("input");
    setCsvFileName("");
    setCsvRows([]);
    setCsvError("");
    setJsonInput("");
    setParseError("");
    setPreviewResult(null);
    setImportedCount(null);
    setShowInvalidRows(false);
    setPendingRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Styles (reusable) ────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    border: "1px solid var(--border-default)",
    borderRadius: "12px",
    padding: "20px",
    backgroundColor: "var(--bg-primary)",
    marginBottom: "16px",
  };

  const btn = (primary: boolean, disabled = false): React.CSSProperties => ({
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 600,
    borderRadius: "8px",
    border: primary ? "none" : "1px solid var(--border-default)",
    backgroundColor: primary ? "var(--text-primary)" : "var(--bg-secondary)",
    color: primary ? "var(--bg-primary)" : "var(--text-primary)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 16px" }}>
      <h1 className="text-page-title mb-1">Bulk Import Questions</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        Upload a CSV or paste JSON — validate, preview, then confirm.
      </p>

      {/* ── Step: Input ── */}
      {step === "input" && (
        <>
          {/* Mode toggle */}
          <div className="flex gap-2 mb-5">
            {(["csv", "json"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setParseError(""); }}
                style={{
                  padding: "6px 18px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: mode === m ? "2px solid var(--text-primary)" : "1px solid var(--border-default)",
                  backgroundColor: mode === m ? "var(--text-primary)" : "transparent",
                  color: mode === m ? "var(--bg-primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* ── CSV mode ── */}
          {mode === "csv" && (
            <div style={card}>
              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                style={{
                  border: `2px dashed ${isDragging ? "var(--text-primary)" : "var(--border-default)"}`,
                  borderRadius: "10px",
                  padding: "40px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: isDragging ? "var(--bg-secondary)" : "transparent",
                  transition: "all 150ms",
                  marginBottom: "16px",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={onFileChange}
                  style={{ display: "none" }}
                />
                {csvFileName ? (
                  <>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {csvFileName}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--color-correct)" }}>
                      {csvRows.length} row{csvRows.length !== 1 ? "s" : ""} loaded
                    </p>
                    <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                      Click to replace
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      Drop CSV file here or click to browse
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                      .csv files only
                    </p>
                  </>
                )}
              </div>

              {csvError && (
                <p className="text-sm mb-3" style={{ color: "var(--color-wrong)" }}>{csvError}</p>
              )}

              {/* Required columns reference */}
              <div
                className="rounded-lg p-3 mb-4"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                  Required columns
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "monospace", lineHeight: 1.8 }}>
                  {CSV_REQUIRED.join(" · ")}
                </p>
                <p className="text-xs mt-2 font-semibold" style={{ color: "var(--text-secondary)" }}>
                  Optional columns
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "monospace", lineHeight: 1.8 }}>
                  {CSV_COLUMNS.filter((c) => !CSV_REQUIRED.includes(c as typeof CSV_REQUIRED[number])).join(" · ")}
                </p>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handlePreview}
                  disabled={loading || csvRows.length === 0}
                  style={btn(true, loading || csvRows.length === 0)}
                >
                  {loading ? "Validating…" : `Preview ${csvRows.length > 0 ? `${csvRows.length} rows` : ""}`}
                </button>
                <button onClick={downloadCSVTemplate} style={btn(false)}>
                  Download CSV Template
                </button>
              </div>
            </div>
          )}

          {/* ── JSON mode ── */}
          {mode === "json" && (
            <div style={card}>
              <label
                htmlFor="json-input"
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                JSON Array
              </label>
              <textarea
                id="json-input"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[{"topicSlug": "percentage", "difficulty": "l1", ...}]'
                style={{
                  width: "100%",
                  minHeight: "280px",
                  padding: "12px",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  resize: "vertical",
                  marginBottom: "16px",
                }}
              />
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handlePreview}
                  disabled={loading || !jsonInput.trim()}
                  style={btn(true, loading || !jsonInput.trim())}
                >
                  {loading ? "Validating…" : "Preview Import"}
                </button>
                <button onClick={downloadJSONTemplate} style={btn(false)}>
                  Download JSON Template
                </button>
              </div>
            </div>
          )}

          {parseError && (
            <p className="text-sm mt-2" style={{ color: "var(--color-wrong)" }}>{parseError}</p>
          )}
        </>
      )}

      {/* ── Step: Preview ── */}
      {step === "preview" && previewResult && (
        <>
          <div style={card}>
            <h2 className="text-section mb-4">Import Preview</h2>

            {/* Summary numbers */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: "Total", value: previewResult.summary.total, color: "var(--text-primary)" },
                { label: "Valid", value: previewResult.summary.valid, color: "var(--color-correct)" },
                { label: "Duplicates", value: previewResult.summary.duplicates, color: "var(--color-amber)" },
                { label: "Errors", value: previewResult.summary.invalid, color: "var(--color-wrong)" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-lg p-3 text-center"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                >
                  <p style={{ fontSize: "24px", fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{label}</p>
                </div>
              ))}
            </div>

            {previewResult.summary.duplicates > 0 && (
              <div
                className="rounded-lg px-4 py-3 mb-4 text-sm"
                style={{ backgroundColor: "var(--color-amber-bg)", color: "var(--color-amber)" }}
              >
                {previewResult.summary.duplicates} duplicate{previewResult.summary.duplicates !== 1 ? "s" : ""} will be skipped automatically.
              </div>
            )}

            {previewResult.summary.invalid > 0 && (
              <div className="mb-2">
                <button
                  onClick={() => setShowInvalidRows(!showInvalidRows)}
                  style={btn(false)}
                >
                  {showInvalidRows ? "Hide" : "Show"} {previewResult.summary.invalid} error{previewResult.summary.invalid !== 1 ? "s" : ""}
                </button>

                {showInvalidRows && (
                  <div
                    className="mt-3 rounded-lg overflow-hidden"
                    style={{ border: "1px solid var(--border-default)", maxHeight: "280px", overflowY: "auto" }}
                  >
                    {previewResult.invalid.map((item, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-3 text-sm"
                        style={{
                          borderBottom: idx < previewResult.invalid.length - 1 ? "1px solid var(--border-subtle)" : "none",
                          backgroundColor: "var(--bg-primary)",
                        }}
                      >
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                          Row {item.row}
                        </span>
                        <span className="ml-3" style={{ color: "var(--color-wrong)" }}>
                          {item.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleConfirmImport}
              disabled={loading || previewResult.summary.valid === 0}
              style={btn(true, loading || previewResult.summary.valid === 0)}
            >
              {loading ? "Importing…" : `Import ${previewResult.summary.valid} question${previewResult.summary.valid !== 1 ? "s" : ""}`}
            </button>
            <button onClick={() => setStep("input")} disabled={loading} style={btn(false, loading)}>
              Back
            </button>
          </div>
        </>
      )}

      {/* ── Step: Done ── */}
      {step === "done" && (
        <div
          style={{ ...card, textAlign: "center", padding: "48px 20px" }}
        >
          <p style={{ fontSize: "48px", lineHeight: 1, marginBottom: "12px" }}>✓</p>
          <h2 className="text-section mb-2">Import Complete</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            {importedCount} question{importedCount !== 1 ? "s" : ""} added to the question bank.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleReset} style={btn(true)}>
              Import More
            </button>
            <Link href="/admin/questions" style={{ ...btn(false), display: "inline-block", textDecoration: "none" }}>
              View Questions →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
