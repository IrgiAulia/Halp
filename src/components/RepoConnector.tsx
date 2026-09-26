"use client";

import { useState, useCallback, type FormEvent } from "react";

interface RepoConnectorProps {
  onConnect: (owner: string, repo: string, pat: string) => void;
  loading: boolean;
}

/**
 * Connect form — Palantir-style dark hero layout.
 * Large uppercase headline, stark form fields, grid background.
 * PAT kept in memory only, never written to localStorage.
 */
export default function RepoConnector({
  onConnect,
  loading,
}: RepoConnectorProps): React.ReactElement {
  const [pat, setPat] = useState("");
  const [repoInput, setRepoInput] = useState("");

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const [owner, repo] = repoInput.trim().split("/");
      if (!owner || !repo) return;
      onConnect(owner, repo, pat);
    },
    [pat, repoInput, onConnect]
  );

  const canSubmit = pat.trim().length > 0 && repoInput.includes("/");

  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      {/* Hero — Palantir large headline + sub */}
      <div style={{ marginBottom: 64 }}>
        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          <svg
            width={48}
            height={48}
            viewBox="0 0 500 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{ display: "block", color: "var(--text)" }}
          >
            <path
              d="M327.272 296.497L254.505 371.426L178.736 298.91L252 238.5L327.272 296.497ZM182 182H192V147.844H245V205L176.054 296.342L134.783 256.844V147.844H182V182ZM365.783 256.844L330.251 293.431L255 205V147.844H308V182H318V147.844H365.783V256.844Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <h1
          style={{
            fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 0.96,
            color: "var(--text)",
            marginBottom: 20,
          }}
        >
          Know which PRs
          <br />
          need your eyes first.
        </h1>

        <p
          style={{
            fontSize: "1rem",
            color: "var(--muted)",
            lineHeight: 1.65,
            maxWidth: 420,
          }}
        >
          4-signal risk scoring — size, AI detection, age, hotspot overlap.
          No setup beyond a read-only GitHub token.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        aria-label="Connect to GitHub repository"
        style={{ display: "flex", flexDirection: "column", gap: 0 }}
      >
        {/* PAT field */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 22,
            paddingBottom: 22,
          }}
        >
          <label
            htmlFor="pat-input"
            className="label-caps"
            style={{ display: "block", marginBottom: 10 }}
          >
            GitHub Access Token
          </label>
          <input
            id="pat-input"
            type="password"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            autoComplete="current-password"
            required
            style={{
              width: "100%",
              background: "none",
              border: "none",
              borderBottom: "1px solid var(--border)",
              color: "var(--text)",
              fontSize: "1rem",
              fontFamily: "monospace",
              padding: "8px 0",
              outline: "none",
              letterSpacing: "0.02em",
              caretColor: "var(--text)",
            }}
            aria-describedby="pat-hint"
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderBottomColor = "var(--text)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderBottomColor = "var(--border)";
            }}
          />
          <p
            id="pat-hint"
            style={{
              fontSize: "0.74rem",
              color: "var(--muted)",
              marginTop: 8,
              letterSpacing: "0.01em",
            }}
          >
            Read-only <code style={{ fontFamily: "monospace", color: "var(--dim)" }}>repo</code> scope.
            Kept in memory — never stored.
          </p>
        </div>

        {/* Repo field */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 22,
            paddingBottom: 22,
          }}
        >
          <label
            htmlFor="repo-input"
            className="label-caps"
            style={{ display: "block", marginBottom: 10 }}
          >
            Repository
          </label>
          <input
            id="repo-input"
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="owner/repository"
            required
            pattern="[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+"
            style={{
              width: "100%",
              background: "none",
              border: "none",
              borderBottom: "1px solid var(--border)",
              color: "var(--text)",
              fontSize: "1rem",
              fontFamily: "monospace",
              padding: "8px 0",
              outline: "none",
              letterSpacing: "0.02em",
              caretColor: "var(--text)",
            }}
            aria-describedby="repo-hint"
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderBottomColor = "var(--text)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderBottomColor = "var(--border)";
            }}
          />
          <p
            id="repo-hint"
            style={{
              fontSize: "0.74rem",
              color: "var(--muted)",
              marginTop: 8,
            }}
          >
            e.g. vercel/next.js
          </p>
        </div>

        {/* Submit */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 22 }}>
          <button
            type="submit"
            disabled={loading || !canSubmit}
            style={{
              width: "100%",
              padding: "14px 24px",
              backgroundColor: canSubmit && !loading ? "var(--text)" : "var(--surface2)",
              color: canSubmit && !loading ? "var(--bg)" : "var(--muted)",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: loading || !canSubmit ? "not-allowed" : "pointer",
              fontFamily: "var(--font)",
              transition: "background-color 0.15s, color 0.15s",
            }}
          >
            {loading ? "Connecting…" : "Connect Repository"}
          </button>
        </div>
      </form>
    </div>
  );
}
