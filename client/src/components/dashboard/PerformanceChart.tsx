import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PerformanceData {
  date: string;
  clicks: number;
  revenue: number;
}

const timeRanges = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Quarter", value: "quarter" },
];

const PerformanceChart = () => {
  const [timeRange, setTimeRange] = useState<string>("month");

  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['/api/performance', timeRange],
  });

  // Format data for the chart
  const chartData: PerformanceData[] = !isLoading && performanceData ? 
    performanceData.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
      clicks: item.clicks,
      revenue: parseFloat(item.revenue.toFixed(2)),
    })) : 
    generateSampleData(timeRange);

  return (
    <Card className="fade-in lg:col-span-2 dark:bg-gray-800 dark:border-gray-700" style={{ animationDelay: "0.4s" }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-primary-800 dark:text-primary-300">Performance Over Time</h3>
          <div className="flex space-x-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range.value)}
                className="text-xs"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 5, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                opacity={0.2}
                stroke="rgba(107, 114, 128, 0.3)" 
              />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'currentColor', opacity: 0.75 }}
                className="text-gray-700 dark:text-gray-300"
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'currentColor', opacity: 0.75 }}
                className="text-gray-700 dark:text-gray-300" 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card-background, #fff)', 
                  borderColor: 'var(--border-color, #e5e7eb)',
                  color: 'var(--text-color, #374151)',
                  borderRadius: '0.375rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Legend 
                wrapperStyle={{ 
                  position: 'relative', 
                  marginTop: '10px',
                  color: 'var(--text-color, #374151)'
                }} 
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorClicks)"
                name="Clicks"
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#059669"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Generate sample data when real data is loading
function generateSampleData(timeRange: string): PerformanceData[] {
  const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
  const data: PerformanceData[] = [];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 0; i < days; i++) {
    const dayIndex = i % 7;
    data.push({
      date: dayNames[dayIndex],
      clicks: 0,
      revenue: 0
    });
  }
  
  return data;
}

export default PerformanceChart;
