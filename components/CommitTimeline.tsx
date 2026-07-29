"use client";

import { useState } from "react";
import type { GitHubRepositoryCommit } from "@/lib/github";

interface CommitTimelineProps {
  commits: GitHubRepositoryCommit[];
}

interface CodeReview {
  summary: string;
  reasoning: string;
  security_risks: string[];
  performance_impact: string;
  beginner_concepts: string;
}

type AnalysisState =
  | { status: "loading" }
  | { status: "success"; review: CodeReview }
  | { status: "error"; message: string };

function formatCommitDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(date));
}

function getCommitTitle(message: string) {
  return message.split("\n", 1)[0];
}

function isCodeReview(value: unknown): value is CodeReview {
  if (!value || typeof value !== "object") return false;

  const review = value as Record<string, unknown>;
  return (
    typeof review.summary === "string" &&
    typeof review.reasoning === "string" &&
    Array.isArray(review.security_risks) &&
    review.security_risks.every((risk) => typeof risk === "string") &&
    typeof review.performance_impact === "string" &&
    typeof review.beginner_concepts === "string"
  );
}

function AnalysisSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-label="Analyzing commit" role="status">
      {["summary", "security", "performance", "concepts"].map((card) => (
        <div key={card} className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="mt-4 h-3 w-full rounded bg-slate-200" />
          <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
        </div>
      ))}
      <span className="sr-only">GitSense AI is analyzing this commit.</span>
    </div>
  );
}

function InsightCard({
  label,
  children,
  tone = "indigo",
}: {
  label: string;
  children: React.ReactNode;
  tone?: "indigo" | "rose" | "amber" | "emerald";
}) {
  const tones = {
    indigo: "border-indigo-100 bg-indigo-50/60 text-indigo-700",
    rose: "border-rose-100 bg-rose-50/60 text-rose-700",
    amber: "border-amber-100 bg-amber-50/60 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
  };

  return (
    <section className={`rounded-xl border p-4 ${tones[tone]}`}>
      <h3 className="text-xs font-bold tracking-[0.12em] uppercase">{label}</h3>
      <div className="mt-2 text-sm leading-6 text-slate-700">{children}</div>
    </section>
  );
}

function ReviewInsights({ review }: { review: CodeReview }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <InsightCard label="Summary">
        <p>{review.summary}</p>
        <p className="mt-3 border-t border-indigo-100 pt-3 text-slate-600">{review.reasoning}</p>
      </InsightCard>
      <InsightCard label="Security risks" tone="rose">
        {review.security_risks.length > 0 ? (
          <ul className="space-y-2">
            {review.security_risks.map((risk) => (
              <li key={risk} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-rose-500" />
                {risk}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-600">No material security risks were identified.</p>
        )}
      </InsightCard>
      <InsightCard label="Performance" tone="amber">
        <p>{review.performance_impact}</p>
      </InsightCard>
      <InsightCard label="Learning concepts" tone="emerald">
        <p>{review.beginner_concepts}</p>
      </InsightCard>
    </div>
  );
}

export function CommitTimeline({ commits }: CommitTimelineProps) {
  const [expandedSha, setExpandedSha] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisState>>({});

  const analyzeCommit = async (commit: GitHubRepositoryCommit) => {
    setExpandedSha(commit.sha);

    if (analyses[commit.sha]?.status === "success" || analyses[commit.sha]?.status === "loading") {
      return;
    }

    setAnalyses((current) => ({ ...current, [commit.sha]: { status: "loading" } }));

    try {
      const diffResponse = await fetch(commit.url, {
        headers: { Accept: "application/vnd.github.v3.diff" },
      });
      if (!diffResponse.ok) {
        throw new Error("GitHub could not retrieve this commit's diff.");
      }

      const diff = await diffResponse.text();
      const analysisResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diff }),
      });
      const result: unknown = await analysisResponse.json();

      if (!analysisResponse.ok) {
        const message =
          result && typeof result === "object" && "error" in result && typeof result.error === "string"
            ? result.error
            : "GitSense AI could not analyze this commit.";
        throw new Error(message);
      }

      if (!isCodeReview(result)) {
        throw new Error("GitSense AI returned an invalid review format.");
      }

      setAnalyses((current) => ({ ...current, [commit.sha]: { status: "success", review: result } }));
    } catch (error) {
      setAnalyses((current) => ({
        ...current,
        [commit.sha]: {
          status: "error",
          message: error instanceof Error ? error.message : "Unable to analyze this commit.",
        },
      }));
    }
  };

  if (commits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
        No commits found for this repository.
      </div>
    );
  }

  return (
    <section aria-label="Commit history" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-slate-900">Commit history</p>
          <p className="mt-0.5 text-xs text-slate-500">Select a commit for an AI-powered review</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
          {commits.length} commits
        </span>
      </div>

      <ol className="px-5 py-3 sm:px-6">
        {commits.map((commit, index) => {
          const author = commit.author ?? commit.commit.author;
          const authorName = "login" in author ? author.login : author.name;
          const isExpanded = expandedSha === commit.sha;
          const analysis = analyses[commit.sha];

          return (
            <li key={commit.sha} className="relative py-4 last:pb-2">
              {index < commits.length - 1 && (
                <span className="absolute left-[18px] top-14 h-[calc(100%-1rem)] w-px bg-slate-200" aria-hidden="true" />
              )}

              <div className="relative flex gap-4">
                {commit.author?.avatar_url ? (
                  // Avatar URLs come directly from GitHub's API response.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={commit.author.avatar_url} alt={`${authorName}'s avatar`} className="size-9 shrink-0 rounded-full border-2 border-white bg-slate-100 object-cover shadow-sm" />
                ) : (
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-white bg-indigo-100 text-xs font-semibold text-indigo-700 shadow-sm" aria-label={`${authorName}'s avatar`}>
                    {authorName.slice(0, 1).toUpperCase()}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => (isExpanded ? setExpandedSha(null) : analyzeCommit(commit))}
                  aria-expanded={isExpanded}
                  className="min-w-0 flex-1 rounded-lg p-1 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <span className="block truncate text-sm font-medium text-slate-900">{getCommitTitle(commit.commit.message)}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span className="font-medium text-slate-600">{authorName}</span>
                    <span className="hidden text-slate-300 sm:inline">•</span>
                    <time dateTime={commit.commit.author.date}>{formatCommitDate(commit.commit.author.date)}</time>
                  </span>
                </button>

                <a href={commit.html_url} target="_blank" rel="noreferrer" className="mt-0.5 hidden shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:block" aria-label={`View commit ${commit.sha} on GitHub`}>
                  {commit.sha.slice(0, 7)}
                </a>
              </div>

              {isExpanded && (
                <div className="ml-[52px] mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-md bg-indigo-600 text-xs font-bold text-white">AI</span>
                    <p className="text-sm font-semibold text-slate-900">GitSense review</p>
                  </div>
                  {analysis?.status === "loading" && <AnalysisSkeleton />}
                  {analysis?.status === "success" && <ReviewInsights review={analysis.review} />}
                  {analysis?.status === "error" && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <p className="text-sm text-rose-800">{analysis.message}</p>
                      <button type="button" onClick={() => analyzeCommit(commit)} className="mt-3 text-sm font-semibold text-rose-700 underline underline-offset-4 hover:text-rose-900">
                        Try again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
