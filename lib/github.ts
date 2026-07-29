/** A GitHub user or organization associated with a commit. */
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

/** The Git author/committer details nested inside the REST API response. */
export interface GitHubCommitPerson {
  name: string;
  email: string;
  date: string;
}

/** The Git data for a single commit. */
export interface GitHubCommitDetails {
  author: GitHubCommitPerson;
  committer: GitHubCommitPerson;
  message: string;
  tree: {
    sha: string;
    url: string;
  };
  url: string;
  comment_count: number;
}

/** One item returned by GitHub's `List commits` endpoint. */
export interface GitHubRepositoryCommit {
  sha: string;
  node_id: string;
  commit: GitHubCommitDetails;
  url: string;
  html_url: string;
  comments_url: string;
  author: GitHubUser | null;
  committer: GitHubUser | null;
  parents: Array<{
    sha: string;
    url: string;
    html_url: string;
  }>;
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

// Avoid retaining unexpectedly large patches in memory when users analyze a
// commit that changes generated files or other large assets.
const MAX_DIFF_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Fetches the 15 most recent commits from a public GitHub repository.
 *
 * Set GITHUB_TOKEN to raise GitHub's unauthenticated API rate limit when this
 * service is used from server-side code.
 */
export async function fetchRepositoryCommits(
  owner: string,
  repo: string,
): Promise<GitHubRepositoryCommit[]> {
  const repositoryOwner = encodeURIComponent(owner);
  const repositoryName = encodeURIComponent(repo);
  const response = await fetch(
    `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/commits?per_page=15`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
    },
  );

  if (response.status === 404) {
    throw new GitHubApiError(
      `Repository \"${owner}/${repo}\" was not found. Verify that it exists and is public.`,
      response.status,
    );
  }

  if (response.status === 403) {
    const resetAt = response.headers.get("x-ratelimit-reset");
    const resetMessage = resetAt
      ? ` Try again after ${new Date(Number(resetAt) * 1000).toLocaleTimeString()}.`
      : "";

    throw new GitHubApiError(
      `GitHub API rate limit exceeded.${resetMessage}`,
      response.status,
    );
  }

  if (!response.ok) {
    throw new GitHubApiError(
      `GitHub API request failed with status ${response.status}.`,
      response.status,
    );
  }

  return (await response.json()) as GitHubRepositoryCommit[];
}

/**
 * Fetches a commit's raw unified diff from GitHub.
 *
 * The returned patch is capped at 10 MiB to protect the application from
 * unusually large commits. Callers can ask the user to inspect those commits
 * directly on GitHub instead.
 */
export async function fetchCommitDiff(
  owner: string,
  repo: string,
  commitSha: string,
): Promise<string> {
  const repositoryOwner = encodeURIComponent(owner);
  const repositoryName = encodeURIComponent(repo);
  const sha = encodeURIComponent(commitSha);
  const response = await fetch(
    `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/commits/${sha}`,
    {
      headers: {
        Accept: "application/vnd.github.v3.diff",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
    },
  );

  if (response.status === 404) {
    throw new GitHubApiError(
      `Commit \"${commitSha}\" was not found in \"${owner}/${repo}\".`,
      response.status,
    );
  }

  if (response.status === 403) {
    throw new GitHubApiError(
      "GitHub API rate limit exceeded while fetching the commit diff.",
      response.status,
    );
  }

  if (!response.ok) {
    throw new GitHubApiError(
      `GitHub API request failed with status ${response.status}.`,
      response.status,
    );
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_DIFF_SIZE_BYTES) {
    throw new GitHubApiError(
      `Commit diff is too large to analyze (limit: ${MAX_DIFF_SIZE_BYTES / 1024 / 1024} MiB).`,
      413,
    );
  }

  const diff = await response.text();
  if (new TextEncoder().encode(diff).byteLength > MAX_DIFF_SIZE_BYTES) {
    throw new GitHubApiError(
      `Commit diff is too large to analyze (limit: ${MAX_DIFF_SIZE_BYTES / 1024 / 1024} MiB).`,
      413,
    );
  }

  return diff;
}
