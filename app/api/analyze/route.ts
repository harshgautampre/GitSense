import { NextResponse } from "next/server";
import type { RepositoryAnalysisResponse } from "@/lib/dashboard-data";

interface AnalyzeRepositoryRequest {
  repositoryUrl: string;
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function isAnalyzeRepositoryRequest(value: unknown): value is AnalyzeRepositoryRequest {
  return (
    !!value &&
    typeof value === "object" &&
    "repositoryUrl" in value &&
    typeof value.repositoryUrl === "string" &&
    value.repositoryUrl.trim().length > 0
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Provide a JSON body containing repositoryUrl." },
      { status: 400 },
    );
  }

  if (!isAnalyzeRepositoryRequest(body)) {
    return NextResponse.json(
      { error: "repositoryUrl must be a non-empty string." },
      { status: 400 },
    );
  }

  await delay(3000);

  const analysis: RepositoryAnalysisResponse = {
    repo_name: "acme-labs/commerce-api",
    health_score: 86,
    total_commits: 1284,
    recent_alerts: [
      "Unvalidated redirect destination in the authentication callback.",
      "N+1 query pattern detected in the order lookup path.",
      "One transitive dependency has a safe security update available.",
    ],
    commit_history: [
      { month: "Jan", additions: 840, deletions: 320, commits: 31 },
      { month: "Feb", additions: 1260, deletions: 470, commits: 43 },
      { month: "Mar", additions: 1100, deletions: 380, commits: 38 },
      { month: "Apr", additions: 1620, deletions: 540, commits: 56 },
      { month: "May", additions: 1360, deletions: 450, commits: 48 },
      { month: "Jun", additions: 1760, deletions: 650, commits: 61 },
    ],
  };

  return NextResponse.json(analysis);
}
