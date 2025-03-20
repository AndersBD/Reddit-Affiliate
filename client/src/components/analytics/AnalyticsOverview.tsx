import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Area, 
  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Pie,
  PieChart,
  Cell,
  Bar,
  BarChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis 
} from "recharts";
import { format, differenceInDays } from "date-fns";
import { TrendingUp, TrendingDown, Equals } from "lucide-react";

interface DateRange {
  from: Date;
  to: Date;
}

interface AnalyticsOverviewProps {
  performance: any;
  isLoading: boolean;
  dateRange: DateRange;
  campaignId?: number;
}

const AnalyticsOverview = ({ 
  performance, 
  isLoading,
  dateRange,
  campaignId 
}: AnalyticsOverviewProps) => {
  const [timeScale, setTimeScale] = useState<"daily" | "weekly" | "monthly">("daily");

  // Parse and prepare data for charts
  const chartData = !isLoading && performance 
    ? prepareChartData(performance, timeScale, dateRange) 
    : [];

  // Calculate metrics for the selected period
  const metrics = !isLoading && performance 
    ? calculateMetrics(performance) 
    : { total: { clicks: 0, impressions: 0, conversions: 0, revenue: 0 } };

  // Convert raw data for pie chart
  const conversionData = !isLoading && performance
    ? [
        { name: "Converted", value: metrics.total.conversions },
        { name: "Not Converted", value: metrics.total.clicks - metrics.total.conversions }
      ]
    : [];

  // Calculate platform wide metrics for radar chart
  const platformData = [
    { subject: "Engagement", A: 85, B: 90 },
    { subject: "Click Rate", A: 80, B: 68 },
    { subject: "Conversion", A: 75, B: 60 },
    { subject: "Cost Efficiency", A: 88, B: 65 },
    { subject: "ROI", A: 90, B: 75 },
  ];

  // Pie chart colors
  const COLORS = ["#3B82F6", "#E5E7EB"];

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard 
          title="Total Clicks"
          value={metrics.total.clicks}
          previousValue={metrics.total.clicks * 0.8} // Simulated previous period
          isLoading={isLoading}
          valuePrefix=""
        />
        <KpiCard 
          title="Conversion Rate"
          value={metrics.total.clicks > 0 
            ? (metrics.total.conversions / metrics.total.clicks) * 100 
            : 0
          }
          previousValue={(metrics.total.clicks > 0 
            ? (metrics.total.conversions / metrics.total.clicks) * 100 
            : 0) * 0.9} // Simulated previous period
          isLoading={isLoading}
          valuePrefix=""
          valueSuffix="%"
          precision={1}
        />
        <KpiCard 
          title="Revenue"
          value={metrics.total.revenue}
          previousValue={metrics.total.revenue * 0.75} // Simulated previous period
          isLoading={isLoading}
          valuePrefix="$"
          precision={2}
        />
        <KpiCard 
          title="Cost per Conversion"
          value={metrics.total.conversions > 0 
            ? (campaignId ? 100 : 250) / metrics.total.conversions 
            : 0
          }
          previousValue={(metrics.total.conversions > 0 
            ? (campaignId ? 100 : 250) / metrics.total.conversions 
            : 0) * 1.1} // Simulated previous period
          isLoading={isLoading}
          valuePrefix="$"
          precision={2}
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Performance Trend</CardTitle>
              <Tabs 
                value={timeScale} 
                onValueChange={(value) => setTimeScale(value as "daily" | "weekly" | "monthly")}
                className="w-[240px]"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversions"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorConversions)"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#F97316"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={conversionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {conversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Traffic by Subreddit</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "r/SaaS", clicks: 1245 },
                    { name: "r/startups", clicks: 986 },
                    { name: "r/webdev", clicks: 754 },
                    { name: "r/marketing", clicks: 631 },
                    { name: "r/SEO", clicks: 498 },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="clicks" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Platform Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={platformData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Your Campaigns"
                    dataKey="A"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.5}
                  />
                  <Radar
                    name="Industry Average"
                    dataKey="B"
                    stroke="#F97316"
                    fill="#F97316"
                    fillOpacity={0.5}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// KPI Card Component
interface KpiCardProps {
  title: string;
  value: number;
  previousValue: number;
  isLoading: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  precision?: number;
}

const KpiCard = ({ 
  title, 
  value, 
  previousValue, 
  isLoading,
  valuePrefix = "",
  valueSuffix = "",
  precision = 0
}: KpiCardProps) => {
  // Calculate percent change
  const percentChange = previousValue > 0 
    ? ((value - previousValue) / previousValue) * 100 
    : 0;
  
  // Determine trend
  const trend = percentChange > 1 
    ? "up" 
    : percentChange < -1 
      ? "down" 
      : "neutral";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          
          {isLoading ? (
            <Skeleton className="h-8 w-3/4" />
          ) : (
            <h3 className="text-2xl font-bold text-primary-800">
              {valuePrefix}{value.toLocaleString(undefined, { 
                minimumFractionDigits: precision,
                maximumFractionDigits: precision
              })}{valueSuffix}
            </h3>
          )}
          
          {isLoading ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <div className={`flex items-center text-xs ${
              trend === "up" 
                ? "text-success-500" 
                : trend === "down" 
                  ? "text-danger-500" 
                  : "text-gray-500"
            }`}>
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : trend === "down" ? (
                <TrendingDown className="h-3 w-3 mr-1" />
              ) : (
                <Equals className="h-3 w-3 mr-1" />
              )}
              <span>
                {Math.abs(percentChange).toFixed(1)}% {trend === "up" ? "increase" : trend === "down" ? "decrease" : "change"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions
function prepareChartData(
  performance: any[], 
  timeScale: "daily" | "weekly" | "monthly",
  dateRange: DateRange
) {
  if (!performance || performance.length === 0) {
    return generatePlaceholderData(dateRange, timeScale);
  }

  // Group data by date according to selected timeScale
  const groupedData = performance.reduce((acc: any, curr: any) => {
    let key;
    const date = new Date(curr.date);
    
    if (timeScale === "daily") {
      key = format(date, "yyyy-MM-dd");
    } else if (timeScale === "weekly") {
      const weekNumber = Math.floor(date.getDate() / 7) + 1;
      key = `${format(date, "yyyy-MM")}-W${weekNumber}`;
    } else {
      key = format(date, "yyyy-MM");
    }
    
    if (!acc[key]) {
      acc[key] = {
        date: key,
        clicks: 0,
        impressions: 0,
        conversions: 0,
        revenue: 0
      };
    }
    
    acc[key].clicks += curr.clicks || 0;
    acc[key].impressions += curr.impressions || 0;
    acc[key].conversions += curr.conversions || 0;
    acc[key].revenue += curr.revenue || 0;
    
    return acc;
  }, {});
  
  // Convert to array and sort by date
  return Object.values(groupedData).sort((a: any, b: any) => 
    a.date.localeCompare(b.date)
  );
}

function calculateMetrics(performance: any[]) {
  if (!performance || performance.length === 0) {
    return {
      total: {
        clicks: 0,
        impressions: 0,
        conversions: 0,
        revenue: 0
      }
    };
  }
  
  // Calculate total metrics
  const total = performance.reduce(
    (acc, curr) => {
      acc.clicks += curr.clicks || 0;
      acc.impressions += curr.impressions || 0;
      acc.conversions += curr.conversions || 0;
      acc.revenue += curr.revenue || 0;
      return acc;
    },
    { clicks: 0, impressions: 0, conversions: 0, revenue: 0 }
  );
  
  return { total };
}

function generatePlaceholderData(dateRange: DateRange, timeScale: "daily" | "weekly" | "monthly") {
  const data = [];
  const from = dateRange.from || new Date();
  const to = dateRange.to || new Date();
  const daysDiff = differenceInDays(to, from) + 1;
  
  // Generate placeholder data based on timeScale
  if (timeScale === "daily") {
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(from);
      date.setDate(date.getDate() + i);
      data.push({
        date: format(date, "yyyy-MM-dd"),
        clicks: 0,
        conversions: 0,
        revenue: 0
      });
    }
  } else if (timeScale === "weekly") {
    const weeksCount = Math.ceil(daysDiff / 7);
    for (let i = 0; i < weeksCount; i++) {
      const date = new Date(from);
      date.setDate(date.getDate() + i * 7);
      data.push({
        date: `${format(date, "yyyy-MM")}-W${Math.floor(date.getDate() / 7) + 1}`,
        clicks: 0,
        conversions: 0,
        revenue: 0
      });
    }
  } else {
    const months: {[key: string]: any} = {};
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(from);
      date.setDate(date.getDate() + i);
      const monthKey = format(date, "yyyy-MM");
      
      if (!months[monthKey]) {
        months[monthKey] = {
          date: monthKey,
          clicks: 0,
          conversions: 0,
          revenue: 0
        };
      }
    }
    
    data.push(...Object.values(months));
  }
  
  return data;
}

export default AnalyticsOverview;
