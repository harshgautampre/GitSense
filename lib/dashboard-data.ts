export type DashboardIcon =
  | "grid"
  | "chart"
  | "repository"
  | "branch"
  | "commit"
  | "shield"
  | "plus";

export interface NavigationItem {
  id: "overview" | "activity" | "commits" | "alerts";
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

export interface RepositoryInput {
  urlLabel: string;
  urlPlaceholder: string;
}

export interface DashboardCopy {
  brand: string;
  statsLabel: string;
  commitsLabel: string;
  healthLabel: string;
  alertsLabel: string;
  viewAllLabel: string;
  analyzeLabel: string;
  analyzingLabel: string;
  latestWhyLabel: string;
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
  navigation: NavigationItem[];
  profile: UserProfile;
  repository: RepositoryInput;
}

export const repositoryDashboardData: RepositoryDashboardData = {
  backgroundImage:
    "https://images.unsplash.com/photo-1519608487953-e999c86e7454?auto=format&fit=crop&w=2400&q=80",
  copy: {
    brand: "GitSense AI",
    statsLabel: "Repository Stats",
    commitsLabel: "Recent Commits",
    healthLabel: "Repository Health",
    alertsLabel: "AI Security Alerts",
    viewAllLabel: "View all",
    analyzeLabel: "Analyze Repository",
    analyzingLabel: "Analyzing…",
    latestWhyLabel: "Why these recent changes?",
  },
  navigation: [
    { id: "overview", label: "Dashboard", icon: "grid", active: true },
    { id: "activity", label: "Commit Activity", icon: "chart" },
    { id: "commits", label: "Commits", icon: "commit" },
    { id: "alerts", label: "Alerts", icon: "shield" },
  ],
  profile: {
    name: "Harsh Gautam",
    role: "Developer workspace",
    initials: "HG",
    avatarUrl: "https://i.pravatar.cc/160?img=12",
  },
  repository: {
    urlLabel: "GitHub Repository URL",
    urlPlaceholder: "https://github.com/owner/repository",
  },
};
