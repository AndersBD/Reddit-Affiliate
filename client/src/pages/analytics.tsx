import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { addDays, format } from "date-fns";
import { CalendarRange, Download, RefreshCcw } from "lucide-react";
import AnalyticsOverview from "@/components/analytics/AnalyticsOverview";
import PerformanceMetrics from "@/components/analytics/PerformanceMetrics";
import CampaignComparison from "@/components/analytics/CampaignComparison";

const Analytics = () => {
  const [location] = useLocation();
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedView, setSelectedView] = useState<string>("overview");

  // Get URL parameter
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const campaignIdParam = searchParams.get('campaignId');

  // Set the selected campaign from URL parameter
  useEffect(() => {
    if (campaignIdParam && selectedCampaign === "all") {
      setSelectedCampaign(campaignIdParam);
    }
  }, [campaignIdParam, selectedCampaign]);

  // Fetch campaigns data
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns'],
  });

  // Fetch performance data with filters
  const { data: performance, isLoading: performanceLoading, refetch: refetchPerformance } = useQuery({
    queryKey: [
      '/api/performance', 
      selectedCampaign !== "all" ? selectedCampaign : undefined,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString()
    ],
  });

  // The date format used for display
  const dateFormat = "MMM d, yyyy";

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-primary-800">Analytics</h1>
        <p className="text-gray-600">Track and analyze your campaign performance</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {!campaignsLoading && campaigns?.map((campaign: any) => (
                  <SelectItem key={campaign.id} value={campaign.id.toString()}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
            />
          </div>
          
          <div className="flex space-x-2 w-full sm:w-auto justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetchPerformance()}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="comparison">Campaign Comparison</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <AnalyticsOverview 
            performance={performance} 
            isLoading={performanceLoading} 
            dateRange={dateRange}
            campaignId={selectedCampaign !== "all" ? parseInt(selectedCampaign) : undefined}
          />
        </TabsContent>
        
        <TabsContent value="metrics" className="space-y-6">
          <PerformanceMetrics 
            performance={performance} 
            isLoading={performanceLoading}
            dateRange={dateRange}
            campaignId={selectedCampaign !== "all" ? parseInt(selectedCampaign) : undefined}
          />
        </TabsContent>
        
        <TabsContent value="comparison" className="space-y-6">
          <CampaignComparison 
            campaigns={campaigns}
            dateRange={dateRange}
            campaignId={selectedCampaign !== "all" ? parseInt(selectedCampaign) : undefined}
          />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Analytics;
