"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={className} style={{ lineHeight: "1.7", color: "var(--text-primary)" }}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => (
            <p style={{ marginBottom: "0.75rem", fontSize: "15px" }}>{children}</p>
          ),
          h1: ({ children }) => (
            <h1 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "1rem", marginTop: "1.5rem", color: "var(--text-primary)" }}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "0.75rem", marginTop: "1.25rem", color: "var(--text-primary)" }}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "0.5rem", marginTop: "1rem", color: "var(--text-primary)" }}>{children}</h3>
          ),
          ul: ({ children }) => (
            <ul style={{ paddingLeft: "1.5rem", marginBottom: "0.75rem", listStyleType: "disc" }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingLeft: "1.5rem", marginBottom: "0.75rem", listStyleType: "decimal" }}>{children}</ol>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: "0.25rem", fontSize: "15px" }}>{children}</li>
          ),
          code: ({ inline, children, ...props }: any) =>
            inline ? (
              <code style={{ backgroundColor: "var(--bg-tertiary)", padding: "0.1rem 0.3rem", borderRadius: "4px", fontSize: "13px", fontFamily: "monospace" }} {...props}>{children}</code>
            ) : (
              <pre style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem", borderRadius: "8px", overflow: "auto", marginBottom: "0.75rem" }}>
                <code style={{ fontSize: "13px", fontFamily: "monospace" }}>{children}</code>
              </pre>
            ),
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: "3px solid var(--border-default)", paddingLeft: "1rem", marginBottom: "0.75rem", color: "var(--text-secondary)" }}>{children}</blockquote>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: "600" }}>{children}</strong>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: "auto", marginBottom: "0.75rem" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "14px" }}>{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{ border: "1px solid var(--border-default)", padding: "0.5rem 0.75rem", fontWeight: "600", backgroundColor: "var(--bg-secondary)", textAlign: "left" }}>{children}</th>
          ),
          td: ({ children }) => (
            <td style={{ border: "1px solid var(--border-default)", padding: "0.5rem 0.75rem" }}>{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
