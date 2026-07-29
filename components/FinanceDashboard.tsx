"use client";

import { useEffect, useState } from "react";
import type {
  ChartSeries,
  DashboardIcon,
  FinanceDashboardData,
  Metric,
} from "@/lib/dashboard-data";

const iconPaths: Record<DashboardIcon, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-5 3 3 5-7" /></>,
  wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" /><path d="M19 9h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a2 2 0 1 1 0-4h3" /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="m15 9 5-5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56v.08h-3v-.08A1.7 1.7 0 0 0 10.66 18.7a1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 15.04a1.7 1.7 0 0 0-1.56-1.04h-.08v-3h.08A1.7 1.7 0 0 0 7 9.96a1.7 1.7 0 0 0-.34-1.88L6.6 8.02 8.72 5.9l.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.7 4.74v-.08h3v.08a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.96 11h.08v3h-.08A1.7 1.7 0 0 0 19.4 15Z" /></>,
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

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
      <span className="size-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.8)]" />
      <span className="shrink-0 font-medium text-white">{prefix}</span>
      <span className={`truncate transition-all duration-300 ${isTransitioning ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"}`}>{features[featureIndex]}</span>
    </div>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  const positive = metric.trend === "up";
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.065] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_50px_rgba(0,0,0,.15)] backdrop-blur-xl">
      <div className={`absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br ${metric.accent} opacity-20 blur-2xl transition group-hover:opacity-35`} />
      <div className="relative flex items-start justify-between">
        <p className="text-sm text-slate-400">{metric.label}</p>
        <span className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${metric.accent} text-white shadow-lg`}><Icon icon={metric.icon} className="size-4" /></span>
      </div>
      <p className="relative mt-5 text-2xl font-semibold tracking-tight text-white">{metric.value}</p>
      <p className={`relative mt-2 text-xs font-medium ${positive ? "text-emerald-300" : "text-rose-300"}`}>{metric.change}</p>
    </article>
  );
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

function CashFlowChart({ data }: { data: FinanceDashboardData["chart"] }) {
  const chartWidth = 720;
  const chartHeight = 240;
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur-xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-base font-semibold text-white">{data.title}</h2><p className="mt-1 text-xs text-slate-400">{data.period}</p></div>
        <div className="flex flex-wrap gap-3">{data.series.map((series) => <span key={series.name} className="flex items-center gap-1.5 text-xs text-slate-400"><i className="size-2 rounded-full" style={{ backgroundColor: series.color }} />{series.name}</span>)}</div>
      </div>
      <div className="mt-6 flex gap-3">
        <div className="flex h-60 flex-col justify-between text-right text-[10px] text-slate-500">{data.yAxisLabels.map((label) => <span key={label}>{label}</span>)}</div>
        <div className="min-w-0 flex-1">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="h-60 w-full overflow-visible" role="img" aria-label={data.title}>
            {[0, 1, 2, 3].map((line) => <line key={line} x1="0" x2={chartWidth} y1={(chartHeight / 3) * line} y2={(chartHeight / 3) * line} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />)}
            {data.series.map((series) => <path key={series.name} d={makePath(series, chartWidth, chartHeight)} fill="none" stroke={series.color} strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_6px_currentColor]" />)}
          </svg>
          <div className="mt-2 flex justify-between text-[10px] text-slate-500">{data.xAxisLabels.map((label) => <span key={label}>{label}</span>)}</div>
        </div>
      </div>
    </section>
  );
}

export function FinanceDashboard({ data }: { data: FinanceDashboardData }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080b16] text-white" style={{ backgroundImage: `linear-gradient(rgba(8,11,22,.78), rgba(8,11,22,.92)), url(${data.backgroundImage})`, backgroundPosition: "center", backgroundSize: "cover" }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(115,86,255,.25),transparent_28%),radial-gradient(circle_at_82%_74%,rgba(0,193,209,.14),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1800px] gap-4 p-3 lg:p-5">
        <aside className="hidden w-[76px] shrink-0 flex-col items-center rounded-3xl border border-white/10 bg-slate-950/55 py-5 shadow-2xl backdrop-blur-2xl lg:flex">
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-cyan-300 text-xl font-bold text-slate-950 shadow-[0_0_28px_rgba(139,92,246,.45)]">{data.copy.brand.slice(0, 1).toUpperCase()}</span>
          <nav className="mt-10 flex flex-1 flex-col gap-3">{data.navigation.map((item) => <button key={item.id} type="button" aria-label={item.label} className={`grid size-11 place-items-center rounded-xl transition ${item.active ? "bg-white text-slate-950 shadow-lg" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}><Icon icon={item.icon} /></button>)}</nav>
          <button type="button" aria-label={data.copy.sendMoneyLabel} className="grid size-11 place-items-center rounded-xl bg-violet-500 text-white shadow-[0_0_22px_rgba(139,92,246,.5)] transition hover:bg-violet-400"><Icon icon="plus" /></button>
        </aside>

        <section className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-slate-950/45 p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
          <header className="flex flex-wrap items-center justify-between gap-5">
            <div><p className="text-sm font-medium text-violet-200">{data.copy.brand}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{data.copy.title}</h1><p className="mt-1 text-sm text-slate-400">{data.copy.subtitle}</p></div>
            <div className="flex items-center gap-3">{data.actionIcons.map((action) => <button key={action.label} type="button" aria-label={action.label} className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"><Icon icon={action.icon} className="size-4" /></button>)}<div className="hidden h-9 w-px bg-white/10 sm:block" /><div className="hidden text-right sm:block"><p className="text-sm font-medium">{data.profile.name}</p><p className="text-xs text-slate-500">{data.profile.role}</p></div><div className="grid size-10 place-items-center rounded-full border border-white/20 bg-cover bg-center text-xs font-semibold" style={{ backgroundImage: `url(${data.profile.avatarUrl})` }}>{data.profile.initials}</div></div>
          </header>
          <div className="mt-6"><FeatureHighlightBar prefix={data.copy.featurePrefix} features={data.features} /></div>
          <section className="mt-7"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">{data.copy.overviewLabel}</h2><button type="button" className="text-xs font-medium text-violet-300 transition hover:text-violet-100">{data.copy.seeInsightsLabel}</button></div><div className="grid gap-4 md:grid-cols-3">{data.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div></section>
          <div className="mt-5"><CashFlowChart data={data.chart} /></div>
          <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.85fr_1.1fr]">
            <article className="rounded-2xl border border-white/10 bg-slate-950/35 p-5 backdrop-blur-xl"><div className="flex items-center justify-between"><h2 className="text-base font-semibold">{data.copy.goalsLabel}</h2><button type="button" className="text-xs text-violet-300 hover:text-violet-100">{data.copy.viewAllLabel}</button></div><div className="mt-5 space-y-5">{data.goals.map((goal) => <div key={goal.title}><div className="flex justify-between gap-4"><div><p className="text-sm font-medium">{goal.title}</p><p className="mt-1 text-xs text-slate-500">{goal.subtitle}</p></div><p className="whitespace-nowrap text-xs text-slate-300">{goal.amount}</p></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${goal.accent}`} style={{ width: `${goal.progress}%` }} /></div></div>)}</div></article>
            <article className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 p-5 backdrop-blur-xl"><div className="absolute -right-8 -top-8 size-28 rounded-full bg-cyan-300/20 blur-2xl" /><h2 className="relative text-base font-semibold">{data.copy.savingsLabel}</h2><p className="relative mt-7 text-3xl font-semibold tracking-tight">{data.savings.value}</p><p className="relative mt-2 text-sm leading-6 text-slate-300">{data.savings.detail}</p><div className="relative mt-6 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${data.savings.progress}%` }} /></div><p className="relative mt-2 text-xs text-cyan-100">{data.savings.label}</p></article>
            <article className="rounded-2xl border border-white/10 bg-slate-950/35 p-5 backdrop-blur-xl"><div className="flex items-center justify-between"><h2 className="text-base font-semibold">{data.copy.transactionsLabel}</h2><button type="button" className="text-xs text-violet-300 hover:text-violet-100">{data.copy.viewAllLabel}</button></div><div className="mt-3 divide-y divide-white/8">{data.transactions.map((transaction) => <div key={transaction.id} className="flex items-center gap-3 py-3"><span className={`grid size-9 place-items-center rounded-xl text-sm ${transaction.iconBackground}`}>{transaction.icon}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{transaction.merchant}</p><p className="mt-0.5 text-xs text-slate-500">{transaction.category} · {transaction.date}</p></div><p className={`text-sm font-medium ${transaction.direction === "credit" ? "text-emerald-300" : "text-white"}`}>{transaction.amount}</p></div>)}</div></article>
          </section>
        </section>

        <aside className="hidden w-[310px] shrink-0 rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-2xl backdrop-blur-2xl 2xl:block"><div className="flex items-center justify-between"><p className="text-sm text-slate-400">{data.profile.availableBalanceLabel}</p><button type="button" aria-label={data.copy.sendMoneyLabel} className="grid size-9 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"><Icon icon="plus" className="size-4" /></button></div><p className="mt-2 text-3xl font-semibold tracking-tight">{data.profile.availableBalance}</p><article className={`relative mt-7 aspect-[1.58/1] overflow-hidden rounded-2xl bg-gradient-to-br ${data.paymentCard.gradient} p-5 shadow-[0_22px_40px_rgba(51,32,135,.35)]`}><div className="absolute -right-6 top-2 size-32 rounded-full border border-white/20" /><div className="absolute -bottom-16 left-12 size-40 rounded-full bg-white/15 blur-xl" /><div className="relative flex h-full flex-col justify-between"><div className="flex justify-between text-xs font-medium tracking-[.18em] text-white/90"><span>{data.paymentCard.label}</span><span>{data.paymentCard.network}</span></div><div><p className="font-mono text-lg tracking-[.22em] text-white">{data.paymentCard.cardNumber}</p><div className="mt-4 flex justify-between text-[9px] uppercase tracking-widest text-white/70"><span>{data.paymentCard.holderLabel}<b className="mt-1 block text-[10px] tracking-[.12em] text-white">{data.paymentCard.holder}</b></span><span>{data.paymentCard.expirationLabel}<b className="mt-1 block text-[10px] tracking-[.12em] text-white">{data.paymentCard.expiration}</b></span></div></div></div></article><div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.045] p-4"><p className="text-sm font-medium">{data.profile.name}</p><p className="mt-1 text-xs text-slate-500">{data.profile.role}</p><button type="button" className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-100">{data.copy.sendMoneyLabel}</button></div></aside>
      </div>
    </main>
  );
}
