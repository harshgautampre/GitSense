"use client";

import {
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import type {
  ChartSeries,
  DashboardIcon,
  Metric,
  RepositoryAnalysisResponse,
  RepositoryChart,
  RepositoryDashboardData,
  SecurityAlert,
} from "@/lib/dashboard-data";

type ModalKind = "graph" | "alerts" | "commits";
type ModalOrigin = { x: number; y: number };

const iconPaths: Record<DashboardIcon, ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 4-5 3 3 5-7" />
    </>
  ),
  repository: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H10l2 2h5.5A2.5 2.5 0 0 1 20 7.5v10a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-12Z" />
      <path d="M8 12h8" />
    </>
  ),
  branch: (
    <>
      <circle cx="6" cy="5" r="2" />
      <circle cx="18" cy="18" r="2" />
      <circle cx="6" cy="19" r="2" />
      <path d="M6 7v10" />
      <path d="M8 19h4a6 6 0 0 0 6-6V8" />
    </>
  ),
  commit: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M3 12h6M15 12h6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
};

function Icon({
  icon,
  className = "size-5",
}: {
  icon: DashboardIcon;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {iconPaths[icon]}
    </svg>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.065] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_50px_rgba(0,0,0,.15)] backdrop-blur-xl">
      <div
        className={`absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br ${metric.accent} opacity-20 blur-2xl`}
      />
      <div className="relative flex justify-between">
        <p className="text-sm text-slate-400">{metric.label}</p>
        <span
          className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${metric.accent}`}
        >
          <Icon icon={metric.icon} className="size-4" />
        </span>
      </div>
      <p className="relative mt-5 text-2xl font-semibold">{metric.value}</p>
      <p
        className={`relative mt-2 text-xs ${metric.trend === "up" ? "text-emerald-300" : "text-rose-300"}`}
      >
        {metric.change}
      </p>
    </article>
  );
}

function makePath(series: ChartSeries, width: number, height: number) {
  const step = width / Math.max(series.values.length - 1, 1);
  return series.values.reduce((path, value, index) => {
    const x = index * step;
    const y = height - (value / 100) * height;
    if (!index) return `M ${x} ${y}`;
    const previousY = height - (series.values[index - 1] / 100) * height;
    return `${path} C ${x - step / 2} ${previousY}, ${x - step / 2} ${y}, ${x} ${y}`;
  }, "");
}

function CommitActivityChart({
  data,
  expanded = false,
  onOpen,
}: {
  data: RepositoryChart;
  expanded?: boolean;
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
}) {
  const height = expanded ? 500 : 240;
  const width = 720;
  const interaction = onOpen
    ? {
        role: "button",
        tabIndex: 0,
        onClick: onOpen,
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          if (event.key === "Enter" || event.key === " ")
            onOpen(event as unknown as MouseEvent<HTMLElement>);
        },
      }
    : {};
  return (
    <section
      {...interaction}
      className={`rounded-2xl border border-white/10 bg-slate-950/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur-xl ${onOpen ? "cursor-zoom-in transition hover:border-cyan-300/35" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{data.title}</h2>
          <p className="mt-1 text-xs text-slate-400">{data.period}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {data.series.map((series) => (
            <span
              key={series.name}
              className="flex items-center gap-1.5 text-xs text-slate-400"
            >
              <i
                className="size-2 rounded-full"
                style={{ backgroundColor: series.color }}
              />
              {series.name}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <div
          className={`flex ${expanded ? "h-[500px]" : "h-60"} flex-col justify-between text-right text-[10px] text-slate-500`}
        >
          {data.yAxisLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className={`${expanded ? "h-[500px]" : "h-60"} w-full overflow-visible`}
            role="img"
            aria-label={data.title}
          >
            {[0, 1, 2, 3].map((line) => (
              <line
                key={line}
                x1="0"
                x2={width}
                y1={(height / 3) * line}
                y2={(height / 3) * line}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4 6"
              />
            ))}
            {data.series.map((series) => (
              <path
                key={series.name}
                d={makePath(series, width, height)}
                fill="none"
                stroke={series.color}
                strokeWidth="3"
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div className="mt-2 flex justify-between text-[10px] text-slate-500">
            {data.xAxisLabels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Modal({
  title,
  origin,
  onClose,
  children,
}: {
  title: string;
  origin: ModalOrigin;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <section
        onClick={(event) => event.stopPropagation()}
        style={{ transformOrigin: `${origin.x}px ${origin.y}px` }}
        className="modal-expand mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-950/90 shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
          {children}
        </div>
      </section>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="h-[154px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.065] p-5"
        >
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="mt-7 h-7 w-20 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function createView(analysis: RepositoryAnalysisResponse): {
  metrics: Metric[];
  chart: RepositoryChart;
  alerts: SecurityAlert[];
} {
  const normalize = (values: number[]) => {
    const max = Math.max(...values, 1);
    return values.map((value) => Math.round((value / max) * 100));
  };
  const commits = analysis.commits;
  const additions = commits.map((commit) => commit.additions);
  const deletions = commits.map((commit) => commit.deletions);
  const total = commits.map(() => 1);
  const max = Math.max(...additions, ...deletions, ...total);
  return {
    metrics: [
      {
        label: "Commits Analyzed",
        value: commits.length.toString(),
        change: "Latest commits returned by GitHub",
        trend: "up",
        icon: "commit",
        accent: "from-violet-500 to-fuchsia-500",
      },
      {
        label: "Open Issues",
        value: analysis.repoDetails.openIssues.toString(),
        change: "Current GitHub repository total",
        trend: "up",
        icon: "shield",
        accent: "from-orange-400 to-rose-500",
      },
      {
        label: "Stars",
        value: analysis.repoDetails.stars.toLocaleString(),
        change: "Current GitHub repository total",
        trend: "up",
        icon: "repository",
        accent: "from-cyan-400 to-blue-500",
      },
    ],
    chart: {
      title: "Commit Activity",
      period: `${commits.length} latest commits returned by GitHub`,
      xAxisLabels: commits.map((commit) =>
        new Intl.DateTimeFormat("en", {
          month: "short",
          day: "numeric",
        }).format(new Date(commit.date)),
      ),
      yAxisLabels: [
        max.toLocaleString(),
        Math.round((max * 2) / 3).toLocaleString(),
        Math.round(max / 3).toLocaleString(),
        "0",
      ],
      series: [
        { name: "Code Additions", color: "#39d9b2", values: normalize(additions) },
        { name: "Code Deletions", color: "#fb7185", values: normalize(deletions) },
        { name: "Total Commits", color: "#67b7ff", values: normalize(total) },
      ],
    },
    alerts: analysis.aiAlerts.map((title, index) => {
      const normalizedTitle = title.toLowerCase();
      const severity = normalizedTitle.includes("critical") || normalizedTitle.includes("security") || normalizedTitle.includes("vulnerab")
        ? "critical"
        : normalizedTitle.includes("performance") || normalizedTitle.includes("slow") || normalizedTitle.includes("risk")
          ? "warning"
          : "info";
      return {
        id: `${index}-${title}`,
        title,
        category: "AI repository finding",
        timestamp: "Current analysis",
        severity,
        icon: severity === "critical" ? "!" : severity === "warning" ? "↗" : "i",
        iconBackground: severity === "critical" ? "bg-rose-500/20 text-rose-200" : severity === "warning" ? "bg-amber-400/20 text-amber-100" : "bg-sky-400/20 text-sky-100",
      };
    }),
  };
}

function getCommitWhy(commit: RepositoryAnalysisResponse["commits"][number]) {
  const subject = commit.message.split("\n")[0].replace(/[.?!]+$/, "").trim();
  const fileCount = commit.files.length;
  const fileContext = fileCount
    ? ` It changes ${fileCount} file${fileCount === 1 ? "" : "s"}${commit.files[0] ? `, including ${commit.files[0].path}` : ""}.`
    : " GitHub did not return modified-file details for this commit.";
  const reason = subject
    ? subject.charAt(0).toLowerCase() + subject.slice(1)
    : "advance the repository work";
  return `This change was probably made to ${reason}.${fileContext}`;
}

function EmptyAnalysisState({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-white/10 bg-slate-950/25 px-5 py-8 text-sm text-slate-400">{children}</p>;
}

function isRepositoryAnalysisResponse(
  value: unknown,
): value is RepositoryAnalysisResponse {
  if (!value || typeof value !== "object") return false;

  const analysis = value as Record<string, unknown>;
  return (
    typeof analysis.repoDetails === "object" &&
    analysis.repoDetails !== null &&
    Array.isArray(analysis.commits) &&
    Array.isArray(analysis.latestFiles) &&
    typeof analysis.aiHealthScore === "number" &&
    Array.isArray(analysis.aiAlerts)
  );
}

function RepositoryPanel({ analysis }: { analysis: RepositoryAnalysisResponse | null }) {
  if (!analysis) return null;

  const { repoDetails } = analysis;
  return (
    <aside className="hidden w-[310px] shrink-0 rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-2xl backdrop-blur-2xl 2xl:block">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Active repository</p>
        <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-cyan-200">
          <Icon icon="repository" className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold">{repoDetails.fullName}</p>
      <p className="mt-1 text-xs text-slate-500">
        {repoDetails.description ?? "No repository description provided."}
      </p>
      <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
        <div className="flex justify-between">
          <span className="text-xs text-slate-500">Default branch</span>
          <span className="font-mono text-xs text-cyan-200">
            {repoDetails.defaultBranch}
          </span>
        </div>
        <div className="mt-4 flex justify-between">
          <span className="text-xs text-slate-500">Last updated</span>
          <span className="text-xs text-slate-300">
            {new Date(repoDetails.updatedAt).toLocaleString()}
          </span>
        </div>
      </div>
    </aside>
  );
}

export function RepositoryDashboard({
  data,
}: {
  data: RepositoryDashboardData;
}) {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RepositoryAnalysisResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [origin, setOrigin] = useState<ModalOrigin>({ x: 0, y: 0 });
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);
  const view = analysis ? createView(analysis) : null;

  const openModal = (kind: ModalKind, event: MouseEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setOrigin({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
    setExpandedCommit(null);
    setModal(kind);
  };
  const analyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryUrl }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const apiError =
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : `API request failed with status ${response.status}.`;
        throw new Error(apiError);
      }
      if (!isRepositoryAnalysisResponse(result)) {
        throw new Error("The API returned an invalid analysis response.");
      }
      setAnalysis(result);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Repository analysis could not be completed.",
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleNavigation = (
    id: string,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    if (id === "activity") openModal("graph", event);
    if (id === "commits") openModal("commits", event);
    if (id === "alerts") openModal("alerts", event);
    if (id === "overview") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const realCommits = analysis?.commits ?? [];

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#080b16] text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(8,11,22,.78), rgba(8,11,22,.92)), url(${data.backgroundImage})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(115,86,255,.25),transparent_28%),radial-gradient(circle_at_82%_74%,rgba(0,193,209,.14),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1800px] gap-4 p-3 lg:p-5">
        <aside className="hidden w-[76px] shrink-0 flex-col items-center rounded-3xl border border-white/10 bg-slate-950/55 py-5 shadow-2xl backdrop-blur-2xl lg:flex">
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-cyan-300 text-xl font-bold text-slate-950">
            {data.copy.brand.slice(0, 1).toUpperCase()}
          </span>
          <nav className="mt-10 flex flex-1 flex-col gap-3">
            {data.navigation.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                onClick={(event) => handleNavigation(item.id, event)}
                className={`grid size-11 place-items-center rounded-xl transition ${item.active ? "bg-white text-slate-950 shadow-lg" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}
              >
                <Icon icon={item.icon} />
              </button>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-slate-950/45 p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
          <header className="relative">
            <h1 className="text-4xl font-bold text-center w-full mt-8 mb-4">
              {data.copy.brand}
            </h1>
            <div className="absolute right-0 top-0 flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{data.profile.name}</p>
                <p className="text-xs text-slate-500">{data.profile.role}</p>
              </div>
              <span
                className="grid size-10 place-items-center rounded-full border border-white/20 bg-cover text-xs font-semibold"
                style={{ backgroundImage: `url(${data.profile.avatarUrl})` }}
              >
                {data.profile.initials}
              </span>
            </div>
          </header>
          <div className="flex flex-col items-center w-full max-w-2xl mx-auto mb-12">
            <label htmlFor="repository-url" className="sr-only">
              {data.repository.urlLabel}
            </label>
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <input
                id="repository-url"
                type="url"
                value={repositoryUrl}
                disabled={isLoading}
                placeholder={data.repository.urlPlaceholder}
                onChange={(event) => setRepositoryUrl(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none focus:border-violet-400 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={analyze}
                disabled={isLoading || !repositoryUrl.trim()}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-5 py-3 text-sm font-semibold shadow-[0_0_22px_rgba(139,92,246,.4)] disabled:opacity-60"
              >
                <Icon icon="plus" className="size-4" />
                {isLoading ? data.copy.analyzingLabel : data.copy.analyzeLabel}
              </button>
            </div>
          </div>
          {analysis && (
            <section className="mb-7 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.045] p-5">
              <h2 className="text-base font-semibold">{data.copy.latestWhyLabel}</h2>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {analysis.commits.slice(0, 2).map((commit) => (
                  <article key={commit.sha} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="truncate text-sm font-medium">{commit.message}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{getCommitWhy(commit)}</p>
                    <p className="mt-3 font-mono text-[11px] text-cyan-200">{commit.sha.slice(0, 7)}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"
            >
              {error}
            </p>
          )}
          <section className="mt-7">
            <div className="mb-4">
              <h2 className="text-base font-semibold">
                {data.copy.statsLabel}
              </h2>
            </div>
            {isLoading ? (
              <AnalysisSkeleton />
            ) : view ? (
              <div className="grid gap-4 md:grid-cols-3">
                {view.metrics.map((metric) => (
                  <MetricCard key={metric.label} metric={metric} />
                ))}
              </div>
            ) : (
              <EmptyAnalysisState>Analyze a repository to load live GitHub statistics.</EmptyAnalysisState>
            )}
          </section>
          <div className="mt-5">
            {isLoading ? (
              <div className="h-[354px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
            ) : view ? (
              <CommitActivityChart
                data={view.chart}
                onOpen={(event) => openModal("graph", event)}
              />
            ) : (
              <EmptyAnalysisState>Commit activity will appear after a repository analysis completes.</EmptyAnalysisState>
            )}
          </div>
          <section className="mt-5 grid gap-5">
            <article className="rounded-2xl border border-white/10 bg-slate-950/35 p-5 backdrop-blur-xl">
              <div className="flex justify-between">
                <h2 className="text-base font-semibold">
                  {data.copy.commitsLabel}
                </h2>
                <button
                  type="button"
                  onClick={(event) => openModal("commits", event)}
                  className="text-xs text-violet-300"
                >
                  {data.copy.viewAllLabel}
                </button>
              </div>
              <div className="mt-3 divide-y divide-white/8">
                {!analysis && <p className="py-3 text-sm text-slate-400">Analyze a repository to load its commit history.</p>}
                {(analysis
                  ? realCommits
                      .slice(0, 3)
                      .map((commit) => ({
                        hash: commit.sha.slice(0, 7),
                        message: commit.message,
                        author: commit.author,
                        timestamp: new Date(commit.date).toLocaleString(),
                        accent: "bg-cyan-400",
                      }))
                  : []
                ).map((commit) => (
                  <div
                    key={commit.hash}
                    className="flex items-center gap-3 py-3"
                  >
                    <span className={`size-2 rounded-full ${commit.accent}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {commit.message}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {commit.author} · {commit.timestamp}
                      </p>
                    </div>
                    <p className="font-mono text-[10px] text-cyan-200">
                      {commit.hash}
                    </p>
                  </div>
                ))}
              </div>
            </article>
            <article className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 p-5 backdrop-blur-xl">
              <h2 className="text-base font-semibold">
                {data.copy.healthLabel}
              </h2>
              {analysis ? (
                <>
                  <p className="mt-7 text-3xl font-semibold">{analysis.aiHealthScore}/100</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Calculated from the AI analysis of the latest returned commit messages.</p>
                  <div className="mt-6 h-2 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${analysis.aiHealthScore}%` }} />
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-400">Analyze a repository to calculate its health score.</p>
              )}
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-950/35 p-5 backdrop-blur-xl">
              <div className="flex justify-between">
                <h2 className="text-base font-semibold">
                  {data.copy.alertsLabel}
                </h2>
                <button
                  type="button"
                  onClick={(event) => openModal("alerts", event)}
                  className="text-xs text-violet-300"
                >
                  {data.copy.viewAllLabel}
                </button>
              </div>
              <div className="mt-3 divide-y divide-white/8">
                {!analysis && <p className="py-3 text-sm text-slate-400">Analyze a repository to view AI-generated alerts.</p>}
                {(view?.alerts ?? []).map((alert) => (
                  <div key={alert.id} className="flex items-center gap-3 py-3">
                    <span
                      className={`grid size-9 place-items-center rounded-xl ${alert.iconBackground}`}
                    >
                      {alert.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {alert.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {alert.category} · {alert.timestamp}
                      </p>
                    </div>
                    <p
                      className={`text-[10px] font-semibold uppercase ${alert.severity === "critical" ? "text-rose-300" : alert.severity === "warning" ? "text-amber-200" : "text-sky-200"}`}
                    >
                      {alert.severity}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </section>
          <RepositoryPanel analysis={analysis} />
      </div>
      {modal === "graph" && view && (
        <Modal
          title={view.chart.title}
          origin={origin}
          onClose={() => setModal(null)}
        >
          <CommitActivityChart data={view.chart} expanded />
        </Modal>
      )}
      {modal === "alerts" && (
        <Modal
          title={data.copy.alertsLabel}
          origin={origin}
          onClose={() => setModal(null)}
        >
          {analysis ? (
            <div className="space-y-4">
              {(view?.alerts ?? []).map((alert) => (
                <article
                  key={alert.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.045] p-5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-10 place-items-center rounded-xl ${alert.iconBackground}`}
                    >
                      {alert.icon}
                    </span>
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {alert.category} · {alert.timestamp}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">
              Analyze a repository to view AI-generated alerts.
            </p>
          )}
        </Modal>
      )}
      {modal === "commits" && (
        <Modal
          title={data.copy.commitsLabel}
          origin={origin}
          onClose={() => setModal(null)}
        >
          {realCommits.length ? (
            <div className="max-h-[calc(100vh-12rem)] space-y-3 overflow-y-auto overscroll-contain pr-2">
              {realCommits.map((commit) => (
                <article
                  key={commit.sha}
                  className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCommit((current) =>
                        current === commit.sha ? null : commit.sha,
                      )
                    }
                    className="flex w-full items-start justify-between gap-4 text-left"
                  >
                    <div>
                      <p className="font-medium">{commit.message}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {commit.author} ·{" "}
                        {new Date(commit.date).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-cyan-200">
                      {commit.sha.slice(0, 7)}
                    </span>
                  </button>
                  {expandedCommit === commit.sha && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <section className="mb-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.045] p-3">
                        <p className="text-xs font-semibold tracking-wider text-cyan-100 uppercase">Probable why</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{getCommitWhy(commit)}</p>
                      </section>
                      <p className="mb-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                        Modified files
                      </p>
                      <ul className="space-y-2">
                        {commit.files.map((file) => (
                          <li
                            key={file.path}
                            className="flex items-center justify-between gap-4 rounded-lg bg-slate-950/50 px-3 py-2 font-mono text-xs"
                          >
                            <span className="truncate text-slate-200">
                              {file.path}
                            </span>
                            <span className="shrink-0 text-slate-400">
                              +{file.additions} −{file.deletions}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">
              Analyze a repository to load its commit history.
            </p>
          )}
        </Modal>
      )}
    </main>
  );
}
