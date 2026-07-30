import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface AnalyzeRepositoryRequest {
  repositoryUrl: string;
}

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
  };
}

interface GitHubCommitDetails extends GitHubCommit {
  commit: GitHubCommit["commit"] & { tree: { sha: string } };
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
  tree: Array<{
    path: string;
    type: "blob" | "tree" | "commit";
    sha: string;
    size?: number;
  }>;
}

interface GeminiAnalysis {
  healthScore: number;
  alerts: string[];
}

class GitHubApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "GitHubApiError";
  }
}

function parseRepositoryUrl(repositoryUrl: string) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(repositoryUrl);
  } catch {
    throw new GitHubApiError("Provide a valid GitHub repository URL.", 400);
  }

  if (parsedUrl.protocol !== "https:" || !["github.com", "www.github.com"].includes(parsedUrl.hostname)) {
    throw new GitHubApiError("The repository URL must point to github.com.", 400);
  }

  const segments = parsedUrl.pathname.split("/").filter(Boolean);
  if (segments.length !== 2) {
    throw new GitHubApiError("Use a repository URL in the form https://github.com/owner/repository.", 400);
  }

  const [owner, rawRepository] = segments;
  const repo = rawRepository.replace(/\.git$/, "");
  if (!owner || !repo) {
    throw new GitHubApiError("The GitHub repository URL is incomplete.", 400);
  }

  return { owner, repo };
}

async function githubFetch<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    throw new GitHubApiError("Repository not found or not accessible with this GitHub token.", 404);
  }

  if (response.status === 403 || response.status === 429) {
    const reset = response.headers.get("x-ratelimit-reset");
    const retryMessage = reset
      ? ` Try again after ${new Date(Number(reset) * 1000).toISOString()}.`
      : "";
    throw new GitHubApiError(`GitHub API rate limit exceeded.${retryMessage}`, 429);
  }

  if (!response.ok) {
    throw new GitHubApiError(`GitHub API request failed with status ${response.status}.`, response.status);
  }

  return response.json() as Promise<T>;
}

function buildCommitContext(commits: GitHubCommit[]) {
  return commits
    .map((commit) => `${commit.sha.slice(0, 7)} | ${commit.commit.author.date} | ${commit.commit.message.slice(0, 500)}`)
    .join("\n")
    .slice(0, 12000);
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

async function analyzeCommitMessages(commitContext: string, apiKey: string): Promise<GeminiAnalysis> {
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Recent commit messages:\n${commitContext}`,
    config: {
      systemInstruction: "You are a senior software engineer reviewing repository health from recent commit messages. Estimate a repository health score from 0 to 100 and identify exactly three concise, credible potential security or performance alerts. Do not claim certainty where commit messages lack evidence.",
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["healthScore", "alerts"],
        properties: {
          healthScore: { type: "number", minimum: 0, maximum: 100 },
          alerts: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: { type: "string" },
          },
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty analysis.");

  const parsed: unknown = JSON.parse(text);
  if (!isGeminiAnalysis(parsed)) throw new Error("Gemini returned an invalid analysis format.");

  return {
    healthScore: Math.max(0, Math.min(100, Math.round(parsed.healthScore))),
    alerts: parsed.alerts.slice(0, 3),
  };
}

export async function POST(request: Request) {
  const githubToken = process.env.GITHUB_TOKEN;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!githubToken || !geminiApiKey) {
    return NextResponse.json(
      { error: "The server requires GITHUB_TOKEN and GEMINI_API_KEY configuration." },
      { status: 500 },
    );
  }

  let body: AnalyzeRepositoryRequest;
  try {
    body = (await request.json()) as AnalyzeRepositoryRequest;
  } catch {
    return NextResponse.json({ error: "Provide a JSON body containing repositoryUrl." }, { status: 400 });
  }

  if (!body.repositoryUrl || typeof body.repositoryUrl !== "string") {
    return NextResponse.json({ error: "repositoryUrl must be a non-empty string." }, { status: 400 });
  }

  try {
    const { owner, repo } = parseRepositoryUrl(body.repositoryUrl.trim());
    const encodedOwner = encodeURIComponent(owner);
    const encodedRepo = encodeURIComponent(repo);
    const [repoDetails, commits] = await Promise.all([
      githubFetch<GitHubRepository>(`/repos/${encodedOwner}/${encodedRepo}`, githubToken),
      githubFetch<GitHubCommit[]>(`/repos/${encodedOwner}/${encodedRepo}/commits?per_page=30`, githubToken),
    ]);

    if (commits.length === 0) {
      throw new GitHubApiError("This repository does not contain any commits to analyze.", 422);
    }

    const commitDetails = await Promise.all(
      commits.map((commit) =>
        githubFetch<GitHubCommitDetails>(
          `/repos/${encodedOwner}/${encodedRepo}/commits/${encodeURIComponent(commit.sha)}`,
          githubToken,
        ),
      ),
    );
    const latestTree = await githubFetch<GitHubTree>(
      `/repos/${encodedOwner}/${encodedRepo}/git/trees/${encodeURIComponent(commitDetails[0].commit.tree.sha)}?recursive=1`,
      githubToken,
    );
    const aiAnalysis = await analyzeCommitMessages(buildCommitContext(commits), geminiApiKey);

    return NextResponse.json({
      repoDetails: {
        name: repoDetails.name,
        fullName: repoDetails.full_name,
        description: repoDetails.description,
        url: repoDetails.html_url,
        defaultBranch: repoDetails.default_branch,
        openIssues: repoDetails.open_issues_count,
        stars: repoDetails.stargazers_count,
        forks: repoDetails.forks_count,
        updatedAt: repoDetails.updated_at,
      },
      commits: commitDetails.map((commit) => ({
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
      aiHealthScore: aiAnalysis.healthScore,
      aiAlerts: aiAnalysis.alerts,
      treeTruncated: latestTree.truncated,
    });
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Repository analysis failed:", error);
    return NextResponse.json(
      { error: "Repository analysis failed. Verify your credentials and try again." },
      { status: 502 },
    );
  }
}
