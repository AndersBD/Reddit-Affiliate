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
  BarChart, 
  Bar, 
  Line, 
  LineChart,
  XAxis, 
  YAxis, 
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, differenceInDays } from "date-fns";

interface DateRange {
  from: Date;
  to: Date;
}

interface PerformanceMetricsProps {
  performance: any;
  isLoading: boolean;
  dateRange: DateRange;
  campaignId?: number;
}

const PerformanceMetrics = ({ 
  performance, 
  isLoading,
  dateRange,
  campaignId
}: PerformanceMetricsProps) => {
  const [selectedMetric, setSelectedMetric] = useState<string>("clicks");

  // Parse metrics data
  const metricsData = !isLoading && performance 
    ? prepareMetricsData(performance, selectedMetric)
    : [];

  // Get top traffic sources
  const topTrafficData = [
    { name: "r/SaaS", value: 1245 },
    { name: "r/startups", value: 986 },
    { name: "r/webdev", value: 754 },
    { name: "r/marketing", value: 631 },
    { name: "r/SEO", value: 498 },
  ];

  // Device distribution
  const deviceData = [
    { name: "Mobile", value: 60 },
    { name: "Desktop", value: 35 },
    { name: "Tablet", value: 5 },
  ];

  // Daypart performance
  const daypartData = [
    { time: "12am-4am", clicks: 120, conversions: 4, ctr: 3.3 },
    { time: "4am-8am", clicks: 280, conversions: 8, ctr: 2.9 },
    { time: "8am-12pm", clicks: 980, conversions: 38, ctr: 3.9 },
    { time: "12pm-4pm", clicks: 1250, conversions: 42, ctr: 3.4 },
    { time: "4pm-8pm", clicks: 1480, conversions: 52, ctr: 3.5 },
    { time: "8pm-12am", clicks: 750, conversions: 24, ctr: 3.2 },
  ];

  // Weekday performance
  const weekdayData = [
    { day: "Mon", clicks: 850, conversions: 28, ctr: 3.3 },
    { day: "Tue", clicks: 920, conversions: 32, ctr: 3.5 },
    { day: "Wed", clicks: 880, conversions: 30, ctr: 3.4 },
    { day: "Thu", clicks: 950, conversions: 35, ctr: 3.7 },
    { day: "Fri", clicks: 1050, conversions: 40, ctr: 3.8 },
    { day: "Sat", clicks: 1400, conversions: 52, ctr: 3.7 },
    { day: "Sun", clicks: 1250, conversions: 46, ctr: 3.7 },
  ];

  // Pie chart colors
  const COLORS = ["#3B82F6", "#F97316", "#10B981", "#8B5CF6", "#EC4899"];

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Performance Metrics</CardTitle>
              <Tabs 
                value={selectedMetric} 
                onValueChange={setSelectedMetric}
                className="w-[360px]"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="clicks">Clicks</TabsTrigger>
                  <TabsTrigger value="conversions">Conversions</TabsTrigger>
                  <TabsTrigger value="revenue">Revenue</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={metricsData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name={selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Top Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topTrafficData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {topTrafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Device Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Time of Day Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={daypartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="clicks" name="Clicks" fill="#3B82F6" />
                  <Bar yAxisId="right" dataKey="conversions" name="Conversions" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Day of Week Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weekdayData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="clicks" name="Clicks" fill="#3B82F6" />
                  <Bar yAxisId="right" dataKey="conversions" name="Conversions" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper function to prepare metrics data
function prepareMetricsData(performance: any[], selectedMetric: string) {
  if (!performance || performance.length === 0) {
    return [];
  }

  return performance.map(record => ({
    date: format(new Date(record.date), "MMM d"),
    value: record[selectedMetric] || 0
  }))
  .sort((a, b) => a.date.localeCompare(b.date));
}

export default PerformanceMetrics;
