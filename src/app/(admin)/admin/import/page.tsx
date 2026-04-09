"use client";

import { useState } from "react";

type Step = "input" | "preview" | "done";

type PreviewResult = {
  summary: { total: number; valid: number; duplicates: number; invalid: number };
  invalid: Array<{ row: number; data: Record<string, unknown>; reason: string }>;
  duplicates: Array<{ row: number; data: Record<string, unknown> }>;
};

type ImportResult = {
  created: number;
};

const TEMPLATE_DATA = [
  {
    topicSlug: "percentage",
    patternTypeName: "basic percentage",
    difficulty: "l1",
    questionText: "What is 25% of 400?",
    optionA: "100",
    optionB: "75",
    optionC: "50",
    optionD: "125",
    correctOption: "a",
    smartSolution: "25% of 400 = 400/4 = 100",
    detailedSolution: "To find 25% of 400: 25/100 × 400 = 100",
    sourceType: "custom",
    sourceYear: null,
  },
  {
    topicSlug: "percentage",
    patternTypeName: "successive change",
    difficulty: "l2",
    questionText: "A price increases by 10% then decreases by 10%. Net change?",
    optionA: "0%",
    optionB: "-1%",
    optionC: "+1%",
    optionD: "-2%",
    correctOption: "b",
    smartSolution: "Net change = -r²/100 = -1%",
    detailedSolution: "After 10% up and 10% down: (1.1)(0.9) = 0.99, so -1%",
    sourceType: "custom",
    sourceYear: null,
  },
];

export default function ImportPage() {
  const [step, setStep] = useState<Step>("input");
  const [jsonInput, setJsonInput] = useState("");
  const [parseError, setParseError] = useState("");
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInvalidRows, setShowInvalidRows] = useState(false);

  function downloadTemplate() {
    const blob = new Blob([JSON.stringify(TEMPLATE_DATA, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "questions-template.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handlePreview() {
    setParseError("");

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonInput);
    } catch {
      setParseError("Invalid JSON. Please check your input.");
      return;
    }

    if (!Array.isArray(parsed)) {
      setParseError("JSON must be an array of question objects.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsed, preview: true }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setParseError(
          errorData.error?.message || "Failed to preview import."
        );
        return;
      }

      const data = (await res.json()) as PreviewResult;
      setPreviewResult(data);
      setStep("preview");
    } catch (error) {
      setParseError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmImport() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonInput);
    } catch {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsed, preview: false }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setParseError(
          errorData.error?.message || "Failed to import questions."
        );
        setStep("input");
        return;
      }

      const data = (await res.json()) as ImportResult;
      setImportResult(data);
      setStep("done");
    } catch (error) {
      setParseError("Network error. Please try again.");
      setStep("input");
    } finally {
      setLoading(false);
    }
  }

  function handleBackToInput() {
    setStep("input");
    setPreviewResult(null);
  }

  function handleImportMore() {
    setStep("input");
    setJsonInput("");
    setParseError("");
    setPreviewResult(null);
    setImportResult(null);
    setShowInvalidRows(false);
  }

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "40px 16px",
      }}
    >
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "8px",
        }}
      >
        Bulk Import Questions
      </h1>
      <p
        style={{
          fontSize: "15px",
          color: "var(--text-secondary)",
          marginBottom: "32px",
        }}
      >
        Import multiple questions at once via JSON.
      </p>

      {step === "input" && (
        <div>
          <div
            style={{
              border: "1px solid var(--border-default)",
              borderRadius: "12px",
              padding: "20px 16px",
              backgroundColor: "var(--bg-primary)",
              marginBottom: "16px",
            }}
          >
            <label
              htmlFor="json-input"
              style={{
                display: "block",
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "8px",
              }}
            >
              JSON Input
            </label>
            <textarea
              id="json-input"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste JSON array of questions here..."
              style={{
                width: "100%",
                minHeight: "320px",
                padding: "12px",
                fontSize: "13px",
                fontFamily: "monospace",
                color: "var(--text-primary)",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                resize: "vertical",
              }}
            />
            {parseError && (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-wrong)",
                  marginTop: "8px",
                }}
              >
                {parseError}
              </p>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <button
              onClick={handlePreview}
              disabled={loading || !jsonInput.trim()}
              style={{
                padding: "12px 24px",
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--bg-primary)",
                backgroundColor: "var(--text-primary)",
                border: "none",
                borderRadius: "8px",
                cursor: loading || !jsonInput.trim() ? "not-allowed" : "pointer",
                opacity: loading || !jsonInput.trim() ? 0.5 : 1,
              }}
            >
              {loading ? "Validating..." : "Preview Import"}
            </button>
            <button
              onClick={downloadTemplate}
              style={{
                padding: "12px 24px",
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Download Template
            </button>
          </div>
        </div>
      )}

      {step === "preview" && previewResult && (
        <div>
          <div
            style={{
              border: "1px solid var(--border-default)",
              borderRadius: "12px",
              padding: "20px 16px",
              backgroundColor: "var(--bg-primary)",
              marginBottom: "16px",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              Import Preview
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-tertiary)",
                    marginBottom: "4px",
                  }}
                >
                  Total Rows
                </p>
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {previewResult.summary.total}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-tertiary)",
                    marginBottom: "4px",
                  }}
                >
                  Valid
                </p>
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "var(--color-correct)",
                  }}
                >
                  {previewResult.summary.valid}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-tertiary)",
                    marginBottom: "4px",
                  }}
                >
                  Duplicates
                </p>
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "var(--color-amber)",
                  }}
                >
                  {previewResult.summary.duplicates}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-tertiary)",
                    marginBottom: "4px",
                  }}
                >
                  Errors
                </p>
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "var(--color-wrong)",
                  }}
                >
                  {previewResult.summary.invalid}
                </p>
              </div>
            </div>

            {previewResult.summary.duplicates > 0 && (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  padding: "12px",
                  backgroundColor: "var(--bg-secondary)",
                  borderRadius: "8px",
                  marginBottom: "16px",
                }}
              >
                {previewResult.summary.duplicates} duplicate{" "}
                {previewResult.summary.duplicates === 1 ? "question" : "questions"}{" "}
                will be skipped.
              </p>
            )}

            {previewResult.summary.invalid > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <button
                  onClick={() => setShowInvalidRows(!showInvalidRows)}
                  style={{
                    padding: "8px 12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginBottom: "8px",
                  }}
                >
                  {showInvalidRows ? "Hide" : "Show"} Invalid Rows
                </button>

                {showInvalidRows && (
                  <div
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                      padding: "12px",
                      backgroundColor: "var(--bg-secondary)",
                      borderRadius: "8px",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    {previewResult.invalid.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "8px",
                          marginBottom: "8px",
                          backgroundColor: "var(--bg-primary)",
                          borderRadius: "6px",
                          fontSize: "13px",
                        }}
                      >
                        <p
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            marginBottom: "4px",
                          }}
                        >
                          Row {item.row}
                        </p>
                        <p style={{ color: "var(--color-wrong)" }}>
                          {item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleConfirmImport}
              disabled={loading || previewResult.summary.valid === 0}
              style={{
                padding: "12px 24px",
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--bg-primary)",
                backgroundColor: "var(--text-primary)",
                border: "none",
                borderRadius: "8px",
                cursor:
                  loading || previewResult.summary.valid === 0
                    ? "not-allowed"
                    : "pointer",
                opacity: loading || previewResult.summary.valid === 0 ? 0.5 : 1,
              }}
            >
              {loading ? "Importing..." : "Confirm Import"}
            </button>
            <button
              onClick={handleBackToInput}
              disabled={loading}
              style={{
                padding: "12px 24px",
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {step === "done" && importResult && (
        <div
          style={{
            border: "1px solid var(--border-default)",
            borderRadius: "12px",
            padding: "40px 16px",
            backgroundColor: "var(--bg-primary)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            Import Complete
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "var(--text-secondary)",
              marginBottom: "24px",
            }}
          >
            {importResult.created} question{importResult.created === 1 ? "" : "s"}{" "}
            added.
          </p>
          <button
            onClick={handleImportMore}
            style={{
              padding: "12px 24px",
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--bg-primary)",
              backgroundColor: "var(--text-primary)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Import More
          </button>
        </div>
      )}
    </div>
  );
}
