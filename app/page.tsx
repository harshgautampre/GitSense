import { FinanceDashboard } from "@/components/FinanceDashboard";
import { financeDashboardData } from "@/lib/dashboard-data";

export default function Home() {
  return <FinanceDashboard data={financeDashboardData} />;
}
