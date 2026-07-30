"use client";

import { useEffect, useState } from "react";
import type {
  ChartSeries,
  DashboardIcon,
  Metric,
  RepositoryAnalysisResponse,
  RepositoryDashboardData,
} from "@/lib/dashboard-data";

const iconPaths: Record<DashboardIcon, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-5 3 3 5-7" /></>,
  repository: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H10l2 2h5.5A2.5 2.5 0 0 1 20 7.5v10a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-12Z" /><path d="M8 12h8" /></>,
  branch: <><circle cx="6" cy="5" r="2" /><circle cx="18" cy="18" r="2" /><circle cx="6" cy="19" r="2" /><path d="M6 7v10" /><path d="M8 19h4a6 6 0 0 0 6-6V8" /></>,
  commit: <><circle cx="12" cy="12" r="3" /><path d="M3 12h6M15 12h6" /></>,
  shield: <><path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M5 12h2m10 0h2M12 5v2m0 10v2" /></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-4.2-4.2" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  "arrow-up": <><path d="m6 10 6-6 6 6" /><path d="M12 4v16" /></>,
  "arrow-down": <><path d="m18 14-6 6-6-6" /><path d="M12 20V4" /></>,
};

function Icon({ icon, className = "size-5" }: { icon: DashboardIcon; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{iconPaths[icon]}</svg>;
}

export function FeatureHighlightBar({ prefix, features }: { prefix: string; features: string[] }) {
  const [featureIndex, setFeatureIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  useEffect(() => {
    let timeoutId: number | undefined;
    const intervalId = window.setInterval(() => {
      setIsTransitioning(true);
      timeoutId = window.setTimeout(() => {
        setFeatureIndex((current) => (current + 1) % features.length);
        setIsTransitioning(false);
      }, 250);
    }, 7000);
    return () => {
      window.clearInterval(intervalId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [features.length]);
  return <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"><span className="size-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.8)]" /><span className="shrink-0 font-medium text-white">{prefix}</span><span className={`truncate transition-all duration-300 ${isTransitioning ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"}`}>{features[featureIndex]}</span></div>;
}

function MetricCard({ metric }: { metric: Metric }) {
  return <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.065] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_50px_rgba(0,0,0,.15)] backdrop-blur-xl"><div className={`absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br ${metric.accent} opacity-20 blur-2xl transition group-hover:opacity-35`} /><div className="relative flex items-start justify-between"><p className="text-sm text-slate-400">{metric.label}</p><span className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${metric.accent} text-white shadow-lg`}><Icon icon={metric.icon} className="size-4" /></span></div><p className="relative mt-5 text-2xl font-semibold tracking-tight text-white">{metric.value}</p><p className={`relative mt-2 text-xs font-medium ${metric.trend === "up" ? "text-emerald-300" : "text-rose-300"}`}>{metric.change}</p></article>;
}

function AnalysisSkeleton({ chart = false }: { chart?: boolean }) {
  if (chart) return <div className="h-[354px] animate-pulse rounded-2xl border border-white/10 bg-slate-950/35 p-6"><div className="h-4 w-32 rounded bg-white/10" /><div className="mt-8 h-60 rounded-xl bg-white/[0.04]" /></div>;
  return <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((index) => <div key={index} className="h-[154px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.065] p-5"><div className="h-3 w-24 rounded bg-white/10" /><div className="mt-7 h-7 w-20 rounded bg-white/10" /><div className="mt-3 h-3 w-16 rounded bg-white/10" /></div>)}</div>;
}

function makePath(series: ChartSeries, width: number, height: number) {
  const step = width / (series.values.length - 1);
  return series.values.reduce((path, value, index) => {
    const x = index * step;
    const y = height - (value / 100) * height;
    if (index === 0) return `M ${x} ${y}`;
    const previousY = height - (series.values[index - 1] / 100) * height;
    const controlX = x - step / 2;
    return `${path} C ${controlX} ${previousY}, ${controlX} ${y}, ${x} ${y}`;
  }, "");
}

function CommitActivityChart({ data }: { data: RepositoryDashboardData["chart"] }) {
  const width = 720;
  const height = 240;
  return <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur-xl sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-white">{data.title}</h2><p className="mt-1 text-xs text-slate-400">{data.period}</p></div><div className="flex flex-wrap gap-3">{data.series.map((series) => <span key={series.name} className="flex items-center gap-1.5 text-xs text-slate-400"><i className="size-2 rounded-full" style={{ backgroundColor: series.color }} />{series.name}</span>)}</div></div><div className="mt-6 flex gap-3"><div className="flex h-60 flex-col justify-between text-right text-[10px] text-slate-500">{data.yAxisLabels.map((label) => <span key={label}>{label}</span>)}</div><div className="min-w-0 flex-1"><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-60 w-full overflow-visible" role="img" aria-label={data.title}>{[0, 1, 2, 3].map((line) => <line key={line} x1="0" x2={width} y1={(height / 3) * line} y2={(height / 3) * line} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />)}{data.series.map((series) => <path key={series.name} d={makePath(series, width, height)} fill="none" stroke={series.color} strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_6px_currentColor]" />)}</svg><div className="mt-2 flex justify-between text-[10px] text-slate-500">{data.xAxisLabels.map((label) => <span key={label}>{label}</span>)}</div></div></div></section>;
}

function getAnalysisView(data: RepositoryDashboardData, analysis: RepositoryAnalysisResponse | null) {
  if (!analysis) return { metrics: data.metrics, chart: data.chart, alerts: data.alerts };
  const normalize = (values: number[]) => {
    const maximum = Math.max(...values, 1);
    return values.map((value) => Math.round((value / maximum) * 100));
  };
  const additions = analysis.commit_history.map((point) => point.additions);
  const deletions = analysis.commit_history.map((point) => point.deletions);
  const commits = analysis.commit_history.map((point) => point.commits);
  const maximum = Math.max(...additions, ...deletions, ...commits);
  return {
    metrics: [
      { ...data.metrics[0], value: analysis.total_commits.toLocaleString() },
      { ...data.metrics[1], label: "Health Score", value: `${analysis.health_score}/100` },
      { ...data.metrics[2], label: "Recent Alerts", value: analysis.recent_alerts.length.toString() },
    ],
    chart: { ...data.chart, xAxisLabels: analysis.commit_history.map((point) => point.month), yAxisLabels: [maximum.toLocaleString(), Math.round((maximum * 2) / 3).toLocaleString(), Math.round(maximum / 3).toLocaleString(), "0"], series: [{ ...data.chart.series[0], values: normalize(additions) }, { ...data.chart.series[1], values: normalize(deletions) }, { ...data.chart.series[2], values: normalize(commits) }] },
    alerts: analysis.recent_alerts.map((title, index) => ({ ...data.alerts[index % data.alerts.length], id: `${index}-${title}`, title })),
  };
}

function RepositoryPanel({ data, repositoryUrl, isLoading, onRepositoryUrlChange, onAnalyze }: { data: RepositoryDashboardData; repositoryUrl: string; isLoading: boolean; onRepositoryUrlChange: (value: string) => void; onAnalyze: () => void }) {
  return <aside className="hidden w-[310px] shrink-0 rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-2xl backdrop-blur-2xl 2xl:block"><div className="flex items-center justify-between"><p className="text-sm text-slate-400">{data.repository.label}</p><span className="grid size-9 place-items-center rounded-xl bg-white/10 text-cyan-200"><Icon icon="repository" className="size-4" /></span></div><p className="mt-2 text-xl font-semibold tracking-tight">{data.repository.name}</p><p className="mt-1 text-xs text-slate-500">{data.repository.description}</p><form className="mt-7 rounded-2xl border border-white/10 bg-white/[0.045] p-4" onSubmit={(event) => event.preventDefault()}><label htmlFor="repository-url" className="text-xs font-medium text-slate-300">{data.repository.urlLabel}</label><input id="repository-url" type="url" value={repositoryUrl} placeholder={data.repository.urlPlaceholder} onChange={(event) => onRepositoryUrlChange(event.target.value)} disabled={isLoading} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 disabled:cursor-not-allowed disabled:opacity-60" /><button type="button" onClick={onAnalyze} disabled={isLoading || !repositoryUrl.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(139,92,246,.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"><Icon icon="plus" className="size-4" />{isLoading ? data.copy.analyzingLabel : data.copy.analyzeLabel}</button></form><div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.045] p-4"><div className="flex items-center justify-between"><span className="text-xs text-slate-500">{data.repository.defaultBranchLabel}</span><span className="font-mono text-xs text-cyan-200">{data.repository.defaultBranch}</span></div><div className="mt-4 flex items-center justify-between"><span className="text-xs text-slate-500">{data.repository.lastScanLabel}</span><span className="text-xs text-slate-300">{data.repository.lastScan}</span></div></div></aside>;
}

export function RepositoryDashboard({ data }: { data: RepositoryDashboardData }) {
  const [repositoryUrl, setRepositoryUrl] = useState(data.repository.url);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RepositoryAnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const view = getAnalysisView(data, analysis);

  const analyzeRepository = async () => {
    setIsLoading(true);
    setAnalysisError(null);
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repositoryUrl }) });
      const result: unknown = await response.json();
      if (!response.ok || !result || typeof result !== "object") throw new Error("Repository analysis could not be completed.");
      setAnalysis(result as RepositoryAnalysisResponse);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Repository analysis could not be completed.");
    } finally {
      setIsLoading(false);
    }
  };

  return <main className="relative min-h-screen overflow-hidden bg-[#080b16] text-white" style={{ backgroundImage: `linear-gradient(rgba(8,11,22,.78), rgba(8,11,22,.92)), url(${data.backgroundImage})`, backgroundPosition: "center", backgroundSize: "cover" }}><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(115,86,255,.25),transparent_28%),radial-gradient(circle_at_82%_74%,rgba(0,193,209,.14),transparent_30%)]" /><div className="relative mx-auto flex min-h-screen max-w-[1800px] gap-4 p-3 lg:p-5"><aside className="hidden w-[76px] shrink-0 flex-col items-center rounded-3xl border border-white/10 bg-slate-950/55 py-5 shadow-2xl backdrop-blur-2xl lg:flex"><span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-cyan-300 text-xl font-bold text-slate-950 shadow-[0_0_28px_rgba(139,92,246,.45)]">{data.copy.brand.slice(0, 1).toUpperCase()}</span><nav className="mt-10 flex flex-1 flex-col gap-3">{data.navigation.map((item) => <button key={item.id} type="button" aria-label={item.label} className={`grid size-11 place-items-center rounded-xl transition ${item.active ? "bg-white text-slate-950 shadow-lg" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}><Icon icon={item.icon} /></button>)}</nav><button type="button" aria-label={data.copy.analyzeLabel} className="grid size-11 place-items-center rounded-xl bg-violet-500 text-white shadow-[0_0_22px_rgba(139,92,246,.5)] transition hover:bg-violet-400"><Icon icon="plus" /></button></aside><section className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-slate-950/45 p-5 shadow-2xl backdrop-blur-2xl sm:p-7"><header className="flex flex-wrap items-center justify-between gap-5"><div><p className="text-sm font-medium text-violet-200">{data.copy.brand}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{data.copy.title}</h1><p className="mt-1 text-sm text-slate-400">{data.copy.subtitle}</p></div><div className="flex items-center gap-3">{data.actionIcons.map((action) => <button key={action.label} type="button" aria-label={action.label} className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"><Icon icon={action.icon} className="size-4" /></button>)}<div className="hidden h-9 w-px bg-white/10 sm:block" /><div className="hidden text-right sm:block"><p className="text-sm font-medium">{data.profile.name}</p><p className="text-xs text-slate-500">{data.profile.role}</p></div><div className="grid size-10 place-items-center rounded-full border border-white/20 bg-cover bg-center text-xs font-semibold" style={{ backgroundImage: `url(${data.profile.avatarUrl})` }}>{data.profile.initials}</div></div></header><div className="mt-6"><FeatureHighlightBar prefix={data.copy.featurePrefix} features={data.features} /></div>{analysisError && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{analysisError}</p>}<section className="mt-7"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">{data.copy.statsLabel}</h2><button type="button" className="text-xs font-medium text-violet-300 transition hover:text-violet-100">{data.copy.seeInsightsLabel}</button></div>{isLoading ? <AnalysisSkeleton /> : <div className="grid gap-4 md:grid-cols-3">{view.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div>}</section><div className="mt-5">{isLoading ? <AnalysisSkeleton chart /> : <CommitActivityChart data={view.chart} />}</div><section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.85fr_1.1fr]"><article className="rounded-2xl border border-white/10 bg-slate-950/35 p-5 backdrop-blur-xl"><div className="flex items-center justify-between"><h2 className="text-base font-semibold">{data.copy.commitsLabel}</h2><button type="button" className="text-xs text-violet-300 hover:text-violet-100">{data.copy.viewAllLabel}</button></div><div className="mt-3 divide-y divide-white/8">{data.commits.map((commit) => <div key={commit.hash} className="flex items-center gap-3 py-3"><span className={`size-2 shrink-0 rounded-full ${commit.accent}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{commit.message}</p><p className="mt-0.5 text-xs text-slate-500">{commit.author} · {commit.timestamp}</p></div><div className="text-right"><p className="font-mono text-[10px] text-cyan-200">{commit.hash}</p><p className="mt-1 text-[10px] text-slate-500">{commit.branch}</p></div></div>)}</div></article><article className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 p-5 backdrop-blur-xl"><div className="absolute -right-8 -top-8 size-28 rounded-full bg-cyan-300/20 blur-2xl" /><h2 className="relative text-base font-semibold">{data.copy.healthLabel}</h2><p className="relative mt-7 text-3xl font-semibold tracking-tight">{analysis ? `${analysis.health_score}/100` : data.health.value}</p><p className="relative mt-2 text-sm leading-6 text-slate-300">{data.health.detail}</p><div className="relative mt-6 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${analysis?.health_score ?? data.health.progress}%` }} /></div><p className="relative mt-2 text-xs text-cyan-100">{data.health.label}</p></article><article className="rounded-2xl border border-white/10 bg-slate-950/35 p-5 backdrop-blur-xl"><div className="flex items-center justify-between"><h2 className="text-base font-semibold">{data.copy.alertsLabel}</h2><button type="button" className="text-xs text-violet-300 hover:text-violet-100">{data.copy.viewAllLabel}</button></div><div className="mt-3 divide-y divide-white/8">{view.alerts.map((alert) => <div key={alert.id} className="flex items-center gap-3 py-3"><span className={`grid size-9 place-items-center rounded-xl text-sm ${alert.iconBackground}`}>{alert.icon}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{alert.title}</p><p className="mt-0.5 text-xs text-slate-500">{alert.category} · {alert.timestamp}</p></div><p className={`text-[10px] font-semibold uppercase ${alert.severity === "critical" ? "text-rose-300" : alert.severity === "warning" ? "text-amber-200" : "text-sky-200"}`}>{alert.severity}</p></div>)}</div></article></section></section><RepositoryPanel data={data} repositoryUrl={repositoryUrl} isLoading={isLoading} onRepositoryUrlChange={setRepositoryUrl} onAnalyze={analyzeRepository} /></div></main>;
}
