export type DashboardIcon =
  | "grid"
  | "chart"
  | "repository"
  | "branch"
  | "commit"
  | "shield"
  | "settings"
  | "bell"
  | "search"
  | "plus"
  | "arrow-up"
  | "arrow-down";

export interface NavigationItem {
  id: string;
  label: string;
  icon: DashboardIcon;
  active?: boolean;
}

export interface Metric {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: DashboardIcon;
  accent: string;
}

export interface ChartSeries {
  name: string;
  color: string;
  values: number[];
}

export interface RepositoryChart {
  title: string;
  period: string;
  yAxisLabels: string[];
  xAxisLabels: string[];
  series: ChartSeries[];
}

export interface RecentCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  branch: string;
  accent: string;
}

export interface RepositoryHealth {
  label: string;
  value: string;
  detail: string;
  progress: number;
}

export interface SecurityAlert {
  id: string;
  title: string;
  category: string;
  timestamp: string;
  severity: "critical" | "warning" | "info";
  icon: string;
  iconBackground: string;
}

export interface UserProfile {
  name: string;
  role: string;
  initials: string;
  avatarUrl: string;
}

export interface RepositoryDetails {
  label: string;
  name: string;
  description: string;
  urlLabel: string;
  url: string;
  urlPlaceholder: string;
  defaultBranchLabel: string;
  defaultBranch: string;
  lastScanLabel: string;
  lastScan: string;
}

export interface DashboardCopy {
  brand: string;
  title: string;
  subtitle: string;
  featurePrefix: string;
  statsLabel: string;
  commitsLabel: string;
  healthLabel: string;
  alertsLabel: string;
  viewAllLabel: string;
  analyzeLabel: string;
  analyzingLabel: string;
  seeInsightsLabel: string;
}

export interface RepositoryAnalysisResponse {
  repoDetails: {
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    defaultBranch: string;
    openIssues: number;
    stars: number;
    forks: number;
    updatedAt: string;
  };
  commits: Array<{
    sha: string;
    message: string;
    author: string;
    date: string;
    url: string;
    additions: number;
    deletions: number;
    files: Array<{
      path: string;
      status: string;
      additions: number;
      deletions: number;
      changes: number;
    }>;
  }>;
  latestFiles: Array<{ path: string; sha: string; size: number | null }>;
  aiHealthScore: number;
  aiAlerts: string[];
  treeTruncated: boolean;
}

export interface RepositoryDashboardData {
  backgroundImage: string;
  copy: DashboardCopy;
  features: string[];
  navigation: NavigationItem[];
  actionIcons: Array<{ label: string; icon: DashboardIcon }>;
  profile: UserProfile;
  repository: RepositoryDetails;
  metrics: Metric[];
  chart: RepositoryChart;
  commits: RecentCommit[];
  health: RepositoryHealth;
  alerts: SecurityAlert[];
}

export const repositoryDashboardData: RepositoryDashboardData = {
  backgroundImage:
    "https://images.unsplash.com/photo-1519608487953-e999c86e7454?auto=format&fit=crop&w=2400&q=80",
  copy: {
    brand: "GitSense AI",
    title: "Repository Dashboard",
    subtitle: "A clear view of your repository health and delivery momentum.",
    featurePrefix: "GitSense update:",
    statsLabel: "Repository Stats",
    commitsLabel: "Recent Commits",
    healthLabel: "Repository Health",
    alertsLabel: "AI Security Alerts",
    viewAllLabel: "View all",
    analyzeLabel: "Analyze Repository",
    analyzingLabel: "Analyzing…",
    seeInsightsLabel: "View AI insights",
  },
  features: [
    "AI review suggestions are ready for your latest pull request.",
    "Two dependency updates need a quick security check.",
    "Commit activity is trending 18% above the previous period.",
  ],
  navigation: [
    { id: "overview", label: "Dashboard", icon: "grid", active: true },
    { id: "activity", label: "Activity", icon: "chart" },
    { id: "commits", label: "Commits", icon: "commit" },
    { id: "alerts", label: "Alerts", icon: "shield" },
  ],
  actionIcons: [
    { label: "Search repositories", icon: "search" },
    { label: "Notifications", icon: "bell" },
  ],
  profile: {
    name: "Harsh Gautam",
    role: "Developer workspace",
    initials: "HG",
    avatarUrl: "https://i.pravatar.cc/160?img=12",
  },
  repository: {
    label: "Active repository",
    name: "acme-labs/commerce-api",
    description: "TypeScript · Next.js · 4 contributors",
    urlLabel: "GitHub Repository URL",
    url: "https://github.com/acme-labs/commerce-api",
    urlPlaceholder: "https://github.com/owner/repository",
    defaultBranchLabel: "Default branch",
    defaultBranch: "main",
    lastScanLabel: "Last analysis",
    lastScan: "12 minutes ago",
  },
  metrics: [
    { label: "Total Commits", value: "1,284", change: "+46 this month", trend: "up", icon: "commit", accent: "from-violet-500 to-fuchsia-500" },
    { label: "Active Branches", value: "18", change: "+3 this week", trend: "up", icon: "branch", accent: "from-cyan-400 to-blue-500" },
    { label: "Open Issues", value: "27", change: "−6 resolved", trend: "down", icon: "shield", accent: "from-orange-400 to-rose-500" },
  ],
  chart: {
    title: "Commit Activity",
    period: "Last 6 months",
    yAxisLabels: ["1.8k", "1.2k", "600", "0"],
    xAxisLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    series: [
      { name: "Code Additions", color: "#39d9b2", values: [42, 63, 55, 81, 68, 88, 78] },
      { name: "Code Deletions", color: "#fb7185", values: [24, 35, 31, 45, 38, 54, 43] },
      { name: "Total Commits", color: "#67b7ff", values: [35, 49, 47, 66, 58, 72, 69] },
    ],
  },
  commits: [
    { hash: "a8c52d1", message: "Add rate-limit protection to analysis endpoint", author: "N. Patel", timestamp: "8 minutes ago", branch: "main", accent: "bg-violet-400" },
    { hash: "e4379ad", message: "Refine commit review loading experience", author: "H. Gautam", timestamp: "42 minutes ago", branch: "feat/review-ui", accent: "bg-cyan-400" },
    { hash: "c91b3f8", message: "Upgrade vulnerable transitive dependency", author: "M. Chen", timestamp: "Yesterday", branch: "chore/deps", accent: "bg-emerald-400" },
  ],
  health: {
    label: "AI review coverage",
    value: "92%",
    detail: "Your recent pull requests have strong automated review coverage.",
    progress: 92,
  },
  alerts: [
    { id: "alert-1", title: "Unvalidated redirect destination", category: "Security risk", timestamp: "Detected 12 minutes ago", severity: "critical", icon: "!", iconBackground: "bg-rose-500/20 text-rose-200" },
    { id: "alert-2", title: "N+1 query pattern in order lookup", category: "Performance warning", timestamp: "Detected 1 hour ago", severity: "warning", icon: "↗", iconBackground: "bg-amber-400/20 text-amber-100" },
    { id: "alert-3", title: "Outdated package has a safe update", category: "Dependency insight", timestamp: "Detected yesterday", severity: "info", icon: "i", iconBackground: "bg-sky-400/20 text-sky-100" },
  ],
};
