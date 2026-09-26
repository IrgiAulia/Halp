"use client";

import { useState, useMemo, useCallback } from "react";
import type { ScoredPR, RiskLevel, PRListOptions } from "@/types";
import PRCard from "@/components/PRCard";

interface PRListProps {
  prs: ScoredPR[];
  loading: boolean;
}

/**
 * PR list with filter tabs and sort selector — editorial layout with dividers.
 */
export default function PRList({
  prs,
  loading,
}: PRListProps): React.ReactElement {
  const [options, setOptions] = useState<PRListOptions>({
    filterRisk: "all",
    sortBy: "score",
    sortDir: "desc",
  });

  const filtered = useMemo(() => {
    let result = [...prs];

    if (options.filterRisk !== "all") {
      result = result.filter(
        (pr) => pr.scoring.riskLevel === options.filterRisk
      );
    }

    result.sort((a, b) => {
      let diff = 0;
      switch (options.sortBy) {
        case "score":
          diff = a.scoring.totalScore - b.scoring.totalScore;
          break;
        case "age":
          diff =
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
          break;
        case "size":
          diff = a.additions + a.deletions - (b.additions + b.deletions);
          break;
        case "number":
          diff = a.number - b.number;
          break;
      }
      return options.sortDir === "desc" ? -diff : diff;
    });

    return result;
  }, [prs, options]);

  const setFilter = useCallback(
    (filterRisk: PRListOptions["filterRisk"]) =>
      setOptions((o) => ({ ...o, filterRisk })),
    []
  );

  const toggleSortDir = useCallback(
    () =>
      setOptions((o) => ({
        ...o,
        sortDir: o.sortDir === "asc" ? "desc" : "asc",
      })),
    []
  );

  const riskFilters: Array<{
    value: PRListOptions["filterRisk"];
    label: string;
    dot?: string;
  }> = [
    { value: "all", label: "All" },
    { value: "critical", label: "Critical", dot: "var(--risk-critical-dot)" },
    { value: "high", label: "High", dot: "var(--risk-high-dot)" },
    { value: "medium", label: "Medium", dot: "var(--risk-medium-dot)" },
    { value: "low", label: "Low", dot: "var(--risk-low-dot)" },
  ];

  return (
    <section aria-label="Pull request list">
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 4,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Filter tabs */}
        <div
          role="group"
          aria-label="Filter by risk level"
          style={{ display: "flex", gap: 0 }}
        >
          {riskFilters.map(({ value, label, dot }, i) => {
            const active = options.filterRisk === value;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                aria-pressed={active}
                style={{
                  fontSize: "0.8rem",
                  fontWeight: active ? 700 : 500,
                  letterSpacing: "0.06em",
                  color: active ? "var(--text)" : "var(--muted)",
                  background: "none",
                  border: "none",
                  borderRight:
                    i < riskFilters.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                  cursor: "pointer",
                  padding: "4px 14px",
                  paddingLeft: i === 0 ? 0 : 14,
                  fontFamily: "var(--font)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  textTransform: "uppercase",
                }}
              >
                {dot && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: dot,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                )}
                {label}
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="label-caps">Sort</span>
          <select
            id="sort-select"
            value={options.sortBy}
            onChange={(e) =>
              setOptions((o) => ({
                ...o,
                sortBy: e.target.value as PRListOptions["sortBy"],
              }))
            }
            aria-label="Sort pull requests by"
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--text)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font)",
              outline: "none",
              appearance: "none",
              WebkitAppearance: "none",
            }}
          >
            <option value="score">Risk</option>
            <option value="age">Age</option>
            <option value="size">Size</option>
            <option value="number">Number</option>
          </select>

          <button
            onClick={toggleSortDir}
            aria-label={`Sort ${options.sortDir === "asc" ? "ascending" : "descending"} — click to toggle`}
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font)",
              padding: 0,
              letterSpacing: "0.04em",
            }}
          >
            {options.sortDir === "desc" ? "↓" : "↑"}
          </button>
        </div>
      </div>

      {/* Count */}
      <p
        className="label-caps"
        style={{ marginBottom: 0, paddingTop: 8 }}
        aria-live="polite"
      >
        {filtered.length} / {prs.length} pull requests
      </p>

      {/* Loading state */}
      {loading && prs.length === 0 && (
        <div
          style={{
            padding: "60px 0",
            textAlign: "center",
            color: "var(--muted)",
          }}
          role="status"
          aria-live="polite"
        >
          <div
            style={{
              width: 16,
              height: 16,
              border: "2px solid var(--border)",
              borderTopColor: "var(--text)",
              borderRadius: "50%",
              margin: "0 auto 12px",
            }}
            className="animate-spin-slow"
            aria-hidden="true"
          />
          <span style={{ fontSize: "0.86rem", letterSpacing: "0.06em" }}>
            Loading…
          </span>
        </div>
      )}

      {/* Empty state */}
      {!loading && prs.length === 0 && (
        <div
          style={{
            padding: "60px 0",
            color: "var(--muted)",
          }}
          role="status"
        >
          <p
            style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", marginBottom: 4 }}
          >
            No open pull requests
          </p>
          <p style={{ fontSize: "0.9rem" }}>
            This repository has no open PRs.
          </p>
        </div>
      )}

      {/* PR list — separated by horizontal rules */}
      <div role="list" aria-label="Pull requests">
        {filtered.map((pr) => (
          <div
            key={pr.id}
            role="listitem"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <PRCard pr={pr} />
          </div>
        ))}

        {filtered.length === 0 && prs.length > 0 && (
          <p
            style={{
              padding: "40px 0",
              fontSize: "0.85rem",
              color: "var(--muted)",
            }}
          >
            No {options.filterRisk !== "all" ? options.filterRisk : ""} risk
            PRs found.
          </p>
        )}
      </div>
    </section>
  );
}
