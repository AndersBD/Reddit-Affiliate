import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis 
} from "recharts";
import { format, differenceInDays } from "date-fns";

interface DateRange {
  from: Date;
  to: Date;
}

interface CampaignComparisonProps {
  campaigns: any[];
  dateRange: DateRange;
  campaignId?: number;
}

const CampaignComparison = ({ 
  campaigns,
  dateRange,
  campaignId
}: CampaignComparisonProps) => {
  const [metric, setMetric] = useState<string>("clicks");
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>(
    campaignId ? [campaignId] : campaigns?.slice(0, 3).map(c => c.id) || []
  );

  // Fetch performance data for each selected campaign
  const { data: performanceData, isLoading } = useQuery({
    queryKey: [
      '/api/performance', 
      selectedCampaigns,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString()
    ],
  });

  // Handle campaign selection toggle
  const toggleCampaign = (id: number) => {
    setSelectedCampaigns(prev => 
      prev.includes(id)
        ? prev.filter(cid => cid !== id)
        : [...prev, id]
    );
  };

  // Format comparison data for bar chart
  const comparisonData = !isLoading && campaigns && performanceData
    ? prepareComparisonData(campaigns, performanceData, selectedCampaigns, metric)
    : [];

  // Format comparison data for radar chart
  const radarData = !isLoading && campaigns && performanceData
    ? prepareRadarData(campaigns, performanceData, selectedCampaigns)
    : [];

  // Format comparison data for line chart (over time)
  const timeSeriesData = !isLoading && campaigns && performanceData
    ? prepareTimeSeriesData(campaigns, performanceData, selectedCampaigns, metric)
    : [];

  // Colors for charts
  const COLORS = ["#3B82F6", "#F97316", "#10B981", "#8B5CF6", "#EC4899"];

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="mb-4">
                <Label htmlFor="metric">Metric</Label>
                <Select value={metric} onValueChange={setMetric}>
                  <SelectTrigger id="metric">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clicks">Clicks</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Select Campaigns to Compare</Label>
                {campaigns?.map((campaign) => (
                  <div key={campaign.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`campaign-${campaign.id}`} 
                      checked={selectedCampaigns.includes(campaign.id)}
                      onCheckedChange={() => toggleCampaign(campaign.id)}
                    />
                    <Label 
                      htmlFor={`campaign-${campaign.id}`}
                      className="cursor-pointer"
                    >
                      {campaign.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Campaign Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      // Format value based on metric
                      if (metric === "revenue") {
                        return [`$${value}`, name];
                      } else {
                        return [value, name];
                      }
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name={metric.charAt(0).toUpperCase() + metric.slice(1)}
                    fill="#3B82F6" 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              {metric.charAt(0).toUpperCase() + metric.slice(1)} Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeriesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedCampaigns.map((campaignId, index) => {
                    const campaign = campaigns?.find(c => c.id === campaignId);
                    return (
                      <Line
                        key={campaignId}
                        type="monotone"
                        dataKey={`campaign-${campaignId}`}
                        name={campaign?.name || `Campaign ${campaignId}`}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Campaign Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart 
                  cx="50%" 
                  cy="50%" 
                  outerRadius="80%" 
                  data={radarData}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  {selectedCampaigns.map((campaignId, index) => {
                    const campaign = campaigns?.find(c => c.id === campaignId);
                    return (
                      <Radar
                        key={campaignId}
                        name={campaign?.name || `Campaign ${campaignId}`}
                        dataKey={`campaign-${campaignId}`}
                        stroke={COLORS[index % COLORS.length]}
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.3}
                      />
                    );
                  })}
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

// Helper function to prepare comparison data for bar chart
function prepareComparisonData(
  campaigns: any[], 
  performanceData: any[], 
  selectedCampaigns: number[], 
  metric: string
) {
  if (!campaigns || !performanceData) return [];

  // Group performance data by campaign
  const campaignMetrics = selectedCampaigns.map(campaignId => {
    const campaign = campaigns.find(c => c.id === campaignId);
    const metrics = performanceData.filter(p => p.campaignId === campaignId);
    
    // Sum up the selected metric
    const value = metrics.reduce((sum, curr) => sum + (curr[metric] || 0), 0);
    
    return {
      name: campaign?.name || `Campaign ${campaignId}`,
      value
    };
  });

  return campaignMetrics;
}

// Helper function to prepare radar chart data
function prepareRadarData(
  campaigns: any[], 
  performanceData: any[], 
  selectedCampaigns: number[]
) {
  if (!campaigns || !performanceData) return [];

  // Define metrics to compare
  const metrics = [
    { id: "clicks", name: "Clicks" },
    { id: "conversions", name: "Conversions" },
    { id: "revenue", name: "Revenue" },
    { id: "ctr", name: "CTR" },
    { id: "roi", name: "ROI" }
  ];

  // Calculate max values for normalization
  const maxValues = metrics.reduce((acc, metric) => {
    acc[metric.id] = Math.max(
      ...selectedCampaigns.map(campaignId => {
        const campaignMetrics = performanceData.filter(p => p.campaignId === campaignId);
        return campaignMetrics.reduce((sum, curr) => sum + (curr[metric.id] || 0), 0);
      }),
      1 // Avoid division by zero
    );
    return acc;
  }, {} as Record<string, number>);

  // Create radar data points
  return metrics.map(metric => {
    const dataPoint: any = { metric: metric.name };
    
    selectedCampaigns.forEach(campaignId => {
      const campaignMetrics = performanceData.filter(p => p.campaignId === campaignId);
      const value = campaignMetrics.reduce((sum, curr) => sum + (curr[metric.id] || 0), 0);
      
      // Normalize to 0-100 scale
      dataPoint[`campaign-${campaignId}`] = Math.round((value / maxValues[metric.id]) * 100);
    });
    
    return dataPoint;
  });
}

// Helper function to prepare time series data
function prepareTimeSeriesData(
  campaigns: any[], 
  performanceData: any[], 
  selectedCampaigns: number[],
  metric: string
) {
  if (!campaigns || !performanceData) return [];

  // Get unique dates from all performance data
  const uniqueDates = [...new Set(
    performanceData.map(p => format(new Date(p.date), "yyyy-MM-dd"))
  )].sort();

  // Create time series data
  return uniqueDates.map(dateStr => {
    const dataPoint: any = { date: format(new Date(dateStr), "MMM d") };
    
    selectedCampaigns.forEach(campaignId => {
      // Find metrics for this campaign on this date
      const dayMetrics = performanceData.filter(p => 
        p.campaignId === campaignId && 
        format(new Date(p.date), "yyyy-MM-dd") === dateStr
      );
      
      // Sum the metric value for this day
      dataPoint[`campaign-${campaignId}`] = dayMetrics.reduce(
        (sum, curr) => sum + (curr[metric] || 0), 
        0
      );
    });
    
    return dataPoint;
  });
}

export default CampaignComparison;
