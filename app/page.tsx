import { RepositoryDashboard } from "@/components/RepositoryDashboard";
import { repositoryDashboardData } from "@/lib/dashboard-data";

export default function Home() {
  return <RepositoryDashboard data={repositoryDashboardData} />;
}
