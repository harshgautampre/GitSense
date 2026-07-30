import { GoogleGenAI } from "@google/genai";
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
    tree?: { sha: string };
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
  tree: Array<{ path: string; type: "blob" | "tree" | "commit"; sha: string; size?: number }>;
}

interface GeminiAnalysis {
  healthScore: number;
  alerts: string[];
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error occurred";
}

function parseRepositoryUrl(repositoryUrl: string) {
  const parsed = new URL(repositoryUrl);
  if (parsed.protocol !== "https:" || !["github.com", "www.github.com"].includes(parsed.hostname)) {
    throw new Error("repositoryUrl must be a GitHub HTTPS URL.");
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length !== 2) {
    throw new Error("Use a repository URL in the form https://github.com/owner/repository.");
  }

  const [owner, repositorySegment] = segments;
  const repo = repositorySegment.replace(/\.git$/, "");
  if (!owner || !repo) throw new Error("The repository URL is incomplete.");

  return { owner: encodeURIComponent(owner), repo: encodeURIComponent(repo) };
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
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!githubToken) throw new Error("GITHUB_TOKEN is not configured.");
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY is not configured.");

    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("repositoryUrl" in body) || typeof body.repositoryUrl !== "string") {
      throw new Error("repositoryUrl must be a non-empty string.");
    }

    const { owner, repo } = parseRepositoryUrl(body.repositoryUrl.trim());

    let repository: GitHubRepository;
    let commits: GitHubCommit[];
    let commitDetails: GitHubCommitDetails[];
    let latestTree: GitHubTree;

    try {
      [repository, commits] = await Promise.all([
        githubFetch<GitHubRepository>(`/repos/${owner}/${repo}`, githubToken),
        githubFetch<GitHubCommit[]>(`/repos/${owner}/${repo}/commits?per_page=30`, githubToken),
      ]);

      if (commits.length === 0) throw new Error("The repository does not contain any commits.");

      commitDetails = await Promise.all(
        commits.map((commit) =>
          githubFetch<GitHubCommitDetails>(`/repos/${owner}/${repo}/commits/${encodeURIComponent(commit.sha)}`, githubToken),
        ),
      );
      latestTree = await githubFetch<GitHubTree>(
        `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(commitDetails[0].commit.tree.sha)}?recursive=1`,
        githubToken,
      );
    } catch (error) {
      console.error("GitHub Error:", error);
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    let aiAnalysis: GeminiAnalysis;
    try {
      const commitContext = commits
        .map((commit) => `${commit.sha.slice(0, 7)} | ${commit.commit.author.date} | ${commit.commit.message.slice(0, 500)}`)
        .join("\n")
        .slice(0, 12000);
      const client = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await client.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Recent commit messages:\n${commitContext}`,
        config: {
          systemInstruction: "You are a senior software engineer. Assess repository health from these recent commit messages. Return a health score from 0 to 100 and exactly three concise potential security or performance alerts.",
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            additionalProperties: false,
            required: ["healthScore", "alerts"],
            properties: {
              healthScore: { type: "number", minimum: 0, maximum: 100 },
              alerts: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
            },
          },
        },
      });

      if (!response.text) throw new Error("Gemini returned an empty response.");
      const parsed: unknown = JSON.parse(response.text);
      if (!isGeminiAnalysis(parsed)) throw new Error("Gemini returned an invalid JSON response.");
      aiAnalysis = {
        healthScore: Math.max(0, Math.min(100, Math.round(parsed.healthScore))),
        alerts: parsed.alerts.slice(0, 3),
      };
    } catch (error) {
      console.error("Gemini Error:", error);
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

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
    console.error("API Route Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
