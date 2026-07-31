import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface GitHubRepository {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  open_issues_count: number;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

interface GitHubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string };
    tree: { sha: string };
  };
  stats: { additions: number; deletions: number; total: number };
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
  }>;
}

interface GitHubTree {
  truncated: boolean;
  tree: Array<{ path: string; type: "blob" | "tree" | "commit"; sha: string; size?: number }>;
}

interface GeminiAnalysis {
  healthScore: number;
  alerts: string[];
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error occurred";
}

function parseRepositoryUrl(repositoryUrl: string) {
  const url = new URL(repositoryUrl);
  if (url.protocol !== "https:" || !["github.com", "www.github.com"].includes(url.hostname)) {
    throw new Error("repositoryUrl must be a GitHub HTTPS URL.");
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length !== 2) {
    throw new Error("Use a repository URL in the form https://github.com/owner/repository.");
  }

  const [owner, repositorySegment] = segments;
  const repo = repositorySegment.replace(/\.git$/, "");
  if (!owner || !repo) throw new Error("The repository URL is incomplete.");

  return { owner: encodeURIComponent(owner), repo: encodeURIComponent(repo) };
}

async function githubFetch<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`GitHub API request failed (${response.status}): ${details || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

function isGeminiAnalysis(value: unknown): value is GeminiAnalysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Record<string, unknown>;
  return (
    typeof analysis.healthScore === "number" &&
    Array.isArray(analysis.alerts) &&
    analysis.alerts.every((alert) => typeof alert === "string")
  );
}

export async function POST(request: Request) {
  if (!process.env.GITHUB_TOKEN || !process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Missing GITHUB_TOKEN or GEMINI_API_KEY environment variables" },
      { status: 400 },
    );
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("repositoryUrl" in body) || typeof body.repositoryUrl !== "string") {
      throw new Error("repositoryUrl must be a non-empty string.");
    }

    const { owner, repo } = parseRepositoryUrl(body.repositoryUrl.trim());

    const [repository, commitList] = await Promise.all([
      githubFetch<GitHubRepository>(`/repos/${owner}/${repo}`),
      githubFetch<GitHubCommit[]>(`/repos/${owner}/${repo}/commits?per_page=30`),
    ]);

    if (commitList.length === 0) throw new Error("The repository does not contain any commits.");

    const commits = await Promise.all(
      commitList.map((commit) => githubFetch<GitHubCommit>(`/repos/${owner}/${repo}/commits/${encodeURIComponent(commit.sha)}`)),
    );
    const latestTree = await githubFetch<GitHubTree>(
      `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(commits[0].commit.tree.sha)}?recursive=1`,
    );

    // This model is confirmed by the configured API key's live model list.
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: "You are a senior software engineer. Assess repository health from recent commit messages. Return JSON with a healthScore from 0 to 100 and exactly three concise potential security or performance alerts.",
      generationConfig: { responseMimeType: "application/json" },
    });
    const commitContext = commitList
      .map((commit) => `${commit.sha.slice(0, 7)} | ${commit.commit.author.date} | ${commit.commit.message.slice(0, 500)}`)
      .join("\n")
      .slice(0, 12000);
    const geminiResult = await model.generateContent(
      `Return only JSON in this shape: {"healthScore": number, "alerts": [string, string, string]}.\n\nRecent commit messages:\n${commitContext}`,
    );
    const geminiText = geminiResult.response.text();
    const parsedGemini: unknown = JSON.parse(geminiText);
    if (!isGeminiAnalysis(parsedGemini)) throw new Error("Gemini returned an invalid JSON response.");

    return NextResponse.json({
      repoDetails: {
        name: repository.name,
        fullName: repository.full_name,
        description: repository.description,
        url: repository.html_url,
        defaultBranch: repository.default_branch,
        openIssues: repository.open_issues_count,
        stars: repository.stargazers_count,
        forks: repository.forks_count,
        updatedAt: repository.updated_at,
      },
      commits: commits.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        url: commit.html_url,
        additions: commit.stats.additions,
        deletions: commit.stats.deletions,
        files: commit.files.map((file) => ({
          path: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
        })),
      })),
      latestFiles: latestTree.tree
        .filter((entry) => entry.type === "blob")
        .map((entry) => ({ path: entry.path, sha: entry.sha, size: entry.size ?? null })),
      aiHealthScore: Math.max(0, Math.min(100, Math.round(parsedGemini.healthScore))),
      aiAlerts: parsedGemini.alerts.slice(0, 3),
      treeTruncated: latestTree.truncated,
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
