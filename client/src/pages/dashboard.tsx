import { useQuery } from "@tanstack/react-query";
import { 
  Megaphone, 
  MousePointer, 
  ArrowRightLeft, 
  DollarSign 
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import TopSubreddits from "@/components/dashboard/TopSubreddits";
import CampaignTable from "@/components/dashboard/CampaignTable";
import ContentGenerator from "@/components/dashboard/ContentGenerator";
import ScheduleManager from "@/components/dashboard/ScheduleManager";
import ComplianceMonitor from "@/components/dashboard/ComplianceMonitor";
import RecentActivity from "@/components/dashboard/RecentActivity";

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/stats'],
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-primary-800 dark:text-primary-300">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Overview of your affiliate campaigns and performance</p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatsCard 
          title="Active Campaigns"
          value={isLoading ? "Loading..." : stats?.activeCampaigns || 0}
          icon={<Megaphone className="h-5 w-5 text-primary-500" />}
          iconBgColor="bg-primary-100 dark:bg-primary-900"
          iconColor="text-primary-500 dark:text-primary-300"
          changeValue="23% from last month"
          changeDirection="up"
        />
        
        <StatsCard 
          title="Monthly Clicks"
          value={isLoading ? "Loading..." : stats?.monthlyClicks?.toLocaleString() || 0}
          icon={<MousePointer className="h-5 w-5 text-warning-500 dark:text-warning-400" />}
          iconBgColor="bg-warning-100 dark:bg-warning-900"
          iconColor="text-warning-500 dark:text-warning-400"
          changeValue="7.8% from last month"
          changeDirection="up"
          animationDelay="0.1s"
        />
        
        <StatsCard 
          title="Conversion Rate"
          value={isLoading ? "Loading..." : `${stats?.conversionRate || 0}%`}
          icon={<ArrowRightLeft className="h-5 w-5 text-success-500 dark:text-success-400" />}
          iconBgColor="bg-success-100 dark:bg-success-900"
          iconColor="text-success-500 dark:text-success-400"
          changeValue="0.5% from last month"
          changeDirection="down"
          animationDelay="0.2s"
        />
        
        <StatsCard 
          title="Revenue"
          value={isLoading ? "Loading..." : `$${stats?.revenue?.toLocaleString() || 0}`}
          icon={<DollarSign className="h-5 w-5 text-primary-500 dark:text-primary-300" />}
          iconBgColor="bg-primary-100 dark:bg-primary-900"
          iconColor="text-primary-500 dark:text-primary-300"
          changeValue="12.3% from last month"
          changeDirection="up"
          animationDelay="0.3s"
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <PerformanceChart />
        <TopSubreddits />
      </div>
      
      {/* Campaign Table */}
      <CampaignTable />
      
      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ContentGenerator />
        <ScheduleManager />
        <ComplianceMonitor />
      </div>
      
      {/* Recent Activity */}
      <RecentActivity />
    </>
  );
};

export default Dashboard;
