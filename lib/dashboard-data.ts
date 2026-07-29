export type DashboardIcon =
  | "grid"
  | "chart"
  | "wallet"
  | "card"
  | "target"
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

export interface FinancialChart {
  title: string;
  period: string;
  yAxisLabels: string[];
  xAxisLabels: string[];
  series: ChartSeries[];
}

export interface Goal {
  title: string;
  subtitle: string;
  amount: string;
  progress: number;
  accent: string;
}

export interface SavingsInsight {
  label: string;
  value: string;
  detail: string;
  progress: number;
}

export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  date: string;
  amount: string;
  direction: "credit" | "debit";
  icon: string;
  iconBackground: string;
}

export interface UserProfile {
  name: string;
  role: string;
  initials: string;
  avatarUrl: string;
  availableBalanceLabel: string;
  availableBalance: string;
}

export interface PaymentCard {
  label: string;
  network: string;
  cardNumber: string;
  holderLabel: string;
  holder: string;
  expirationLabel: string;
  expiration: string;
  gradient: string;
}

export interface DashboardCopy {
  brand: string;
  title: string;
  subtitle: string;
  featurePrefix: string;
  overviewLabel: string;
  goalsLabel: string;
  savingsLabel: string;
  transactionsLabel: string;
  viewAllLabel: string;
  sendMoneyLabel: string;
  seeInsightsLabel: string;
}

export interface FinanceDashboardData {
  backgroundImage: string;
  copy: DashboardCopy;
  features: string[];
  navigation: NavigationItem[];
  actionIcons: Array<{ label: string; icon: DashboardIcon }>;
  profile: UserProfile;
  metrics: Metric[];
  chart: FinancialChart;
  goals: Goal[];
  savings: SavingsInsight;
  transactions: Transaction[];
  paymentCard: PaymentCard;
}

export const financeDashboardData: FinanceDashboardData = {
  backgroundImage:
    "https://images.unsplash.com/photo-1519608487953-e999c86e7454?auto=format&fit=crop&w=2400&q=80",
  copy: {
    brand: "luma",
    title: "Good evening, Aria",
    subtitle: "Here is your financial pulse for today.",
    featurePrefix: "New in Luma:",
    overviewLabel: "Financial overview",
    goalsLabel: "Goals in motion",
    savingsLabel: "Savings velocity",
    transactionsLabel: "Recent activity",
    viewAllLabel: "View all",
    sendMoneyLabel: "Send money",
    seeInsightsLabel: "See insights",
  },
  features: [
    "See recurring subscriptions before they renew.",
    "Your personalized cash-flow forecast is ready.",
    "Set a weekly spending guardrail in seconds.",
  ],
  navigation: [
    { id: "overview", label: "Overview", icon: "grid", active: true },
    { id: "insights", label: "Insights", icon: "chart" },
    { id: "accounts", label: "Accounts", icon: "wallet" },
    { id: "cards", label: "Cards", icon: "card" },
    { id: "goals", label: "Goals", icon: "target" },
    { id: "settings", label: "Settings", icon: "settings" },
  ],
  actionIcons: [
    { label: "Search", icon: "search" },
    { label: "Notifications", icon: "bell" },
  ],
  profile: {
    name: "Aria Mitchell",
    role: "Personal workspace",
    initials: "AM",
    avatarUrl: "https://i.pravatar.cc/160?img=47",
    availableBalanceLabel: "Available balance",
    availableBalance: "$24,860.42",
  },
  metrics: [
    { label: "Total balance", value: "$48,240.76", change: "+8.2%", trend: "up", icon: "wallet", accent: "from-violet-500 to-fuchsia-500" },
    { label: "Monthly income", value: "$12,480.00", change: "+12.4%", trend: "up", icon: "arrow-up", accent: "from-cyan-400 to-blue-500" },
    { label: "Monthly spending", value: "$4,875.36", change: "−3.8%", trend: "down", icon: "arrow-down", accent: "from-orange-400 to-rose-500" },
  ],
  chart: {
    title: "Cash flow",
    period: "Last 6 months",
    yAxisLabels: ["$15k", "$10k", "$5k", "$0"],
    xAxisLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    series: [
      { name: "Income", color: "#9d8cff", values: [48, 57, 54, 68, 62, 76, 80] },
      { name: "Spending", color: "#39d9b2", values: [30, 38, 32, 46, 38, 52, 45] },
      { name: "Savings", color: "#ffbe55", values: [17, 22, 25, 22, 31, 25, 35] },
    ],
  },
  goals: [
    { title: "Tokyo escape", subtitle: "Target: October 2026", amount: "$6,840 / $9,000", progress: 76, accent: "bg-violet-400" },
    { title: "Home studio", subtitle: "Target: December 2026", amount: "$2,150 / $5,000", progress: 43, accent: "bg-cyan-400" },
  ],
  savings: {
    label: "Saved this month",
    value: "$1,735.64",
    detail: "You are ahead of your monthly plan by 14%.",
    progress: 72,
  },
  transactions: [
    { id: "tx-1", merchant: "Northern Light", category: "Travel", date: "Today, 09:42", amount: "−$248.00", direction: "debit", icon: "✦", iconBackground: "bg-violet-500/20 text-violet-200" },
    { id: "tx-2", merchant: "Freelance invoice", category: "Income", date: "Yesterday, 17:20", amount: "+$2,400.00", direction: "credit", icon: "↗", iconBackground: "bg-emerald-400/20 text-emerald-200" },
    { id: "tx-3", merchant: "Atelier Coffee", category: "Dining", date: "Yesterday, 10:16", amount: "−$12.80", direction: "debit", icon: "●", iconBackground: "bg-amber-400/20 text-amber-100" },
  ],
  paymentCard: {
    label: "Luma signature",
    network: "VISA",
    cardNumber: "•••• 8472",
    holderLabel: "Card holder",
    holder: "ARIA MITCHELL",
    expirationLabel: "Valid thru",
    expiration: "08/29",
    gradient: "from-violet-500 via-indigo-500 to-cyan-400",
  },
};
