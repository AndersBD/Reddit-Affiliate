import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Edit, BarChart2, MoreVertical, Bot, TrendingUp, Code, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { updateCampaign } from "@/lib/api";

interface Campaign {
  id: number;
  name: string;
  status: string;
  targetSubreddits: string[];
  schedule: any;
  affiliateProgramId: number;
  affiliateProgramName?: string;
}

interface CampaignMetrics {
  clicks: number;
  conversions: number;
  performance: number;
  roi: number;
  revenue: number;
}

const CampaignTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [programFilter, setProgramFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['/api/campaigns'],
  });

  const { data: affiliatePrograms } = useQuery({
    queryKey: ['/api/affiliate-programs'],
  });

  const { data: performanceMetrics } = useQuery({
    queryKey: ['/api/performance'],
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
    }
  });

  // Combine campaigns with their performance metrics
  const campaignsWithMetrics = !isLoading && campaigns ? campaigns.map((campaign: Campaign) => {
    // Find the affiliate program name
    const program = affiliatePrograms?.find((p: any) => p.id === campaign.affiliateProgramId);
    
    // Find performance metrics for this campaign
    const metrics = getCampaignMetrics(campaign.id);
    
    return {
      ...campaign,
      affiliateProgramName: program?.name || "Unknown Program",
      metrics
    };
  }) : [];

  const filteredCampaigns = programFilter === "all" 
    ? campaignsWithMetrics 
    : campaignsWithMetrics.filter((c: any) => c.affiliateProgramId.toString() === programFilter);

  // Get metrics for a campaign
  function getCampaignMetrics(campaignId: number): CampaignMetrics {
    const performanceData = performanceMetrics?.filter((p: any) => p.campaignId === campaignId) || [];
    
    if (performanceData.length === 0) {
      return {
        clicks: 0,
        conversions: 0,
        performance: 0,
        roi: 0,
        revenue: 0
      };
    }
    
    const totalClicks = performanceData.reduce((sum: number, m: any) => sum + m.clicks, 0);
    const totalConversions = performanceData.reduce((sum: number, m: any) => sum + m.conversions, 0);
    const totalRevenue = performanceData.reduce((sum: number, m: any) => sum + m.revenue, 0);
    
    // Calculate performance as % of target (for demo, use 500 clicks as target)
    const performanceValue: number = Math.min(100, Math.round((totalClicks / 500) * 100));
    
    // Calculate ROI (for demo, assume cost of $100 per campaign)
    const cost = 100; 
    const roi = totalRevenue > 0 ? Math.round(((totalRevenue - cost) / cost) * 100) : 0;
    
    return {
      clicks: totalClicks,
      conversions: totalConversions,
      performance: performanceValue,
      roi,
      revenue: totalRevenue
    };
  }

  // Get appropriate icon for campaign
  function getCampaignIcon(campaignName: string) {
    if (campaignName.includes("AI") || campaignName.includes("Assistant")) {
      return <Bot className="text-primary-700" />;
    } else if (campaignName.includes("Trading") || campaignName.includes("Invest")) {
      return <TrendingUp className="text-blue-700" />;
    } else if (campaignName.includes("Code") || campaignName.includes("Pro")) {
      return <Code className="text-purple-700" />;
    } else if (campaignName.includes("Cloud") || campaignName.includes("Stack")) {
      return <Cloud className="text-red-700" />;
    } else {
      return <Bot className="text-primary-700" />;
    }
  }

  // Get status badge with appropriate color
  function getStatusBadge(status: string) {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900">Active</Badge>;
      case "paused":
        return <Badge className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900">Paused</Badge>;
      case "scheduled":
        return <Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900">Scheduled</Badge>;
      default:
        return <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">{status}</Badge>;
    }
  }

  // Format schedule display
  function formatSchedule(campaign: Campaign): { primary: string; secondary: string } {
    if (!campaign.schedule) {
      return {
        primary: "Not scheduled",
        secondary: ""
      };
    }
    
    const { frequency, timeRanges, daysOfWeek, timezone } = campaign.schedule;
    
    if (frequency === "daily") {
      return {
        primary: `Daily, ${timeRanges?.[0] || ""}`,
        secondary: "Next: Today"
      };
    } else if (frequency === "weekly") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const daysList = daysOfWeek?.map((d: number) => days[d]).join(" & ") || "";
      return {
        primary: `Weekly, ${daysList}`,
        secondary: `Next: ${getNextScheduledDay(daysOfWeek)}`
      };
    } else {
      return {
        primary: frequency || "Custom schedule",
        secondary: timezone || ""
      };
    }
  }

  // Helper to get next scheduled day
  function getNextScheduledDay(daysOfWeek?: number[]) {
    if (!daysOfWeek || daysOfWeek.length === 0) return "Unknown";
    
    const today = new Date().getDay(); // 0-6, Sunday-Saturday
    const nextDayIndex = daysOfWeek.find(d => d > today);
    
    if (nextDayIndex !== undefined) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return days[nextDayIndex];
    } else {
      // Wrap around to the first day in the schedule
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return days[daysOfWeek[0]];
    }
  }

  // Format ROI display
  function formatROI(roi: number) {
    return {
      value: `${roi >= 0 ? "+" : ""}${roi}%`,
      className: roi >= 0 ? "text-success-700 dark:text-success-400" : "text-danger-700 dark:text-danger-400"
    };
  }

  // Toggle campaign status
  const toggleCampaignStatus = (campaign: Campaign) => {
    const newStatus = campaign.status === "active" ? "paused" : "active";
    updateCampaignMutation.mutate({ 
      id: campaign.id, 
      data: { status: newStatus } 
    });
  };

  return (
    <Card className="fade-in mb-6 dark:bg-gray-800 dark:border-gray-700" style={{ animationDelay: "0.6s" }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-primary-800 dark:text-primary-300">Recent Campaigns</h3>
          <div className="flex space-x-2">
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border-0 text-sm w-[180px] dark:text-gray-200">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {affiliatePrograms?.map((program: any) => (
                  <SelectItem key={program.id} value={program.id.toString()}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600">
              <Link href="/campaigns/new">
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  New Campaign
                </span>
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campaign</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subreddit</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Schedule</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Performance</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ROI</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                // Loading skeleton
                Array(4).fill(0).map((_, index) => (
                  <tr key={index}>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-md dark:bg-gray-700" />
                        <div className="ml-3">
                          <Skeleton className="h-4 w-32 dark:bg-gray-700" />
                          <Skeleton className="h-3 w-24 mt-1 dark:bg-gray-700" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-16 rounded-full dark:bg-gray-700" />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-32 dark:bg-gray-700" />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24 dark:bg-gray-700" />
                      <Skeleton className="h-3 w-20 mt-1 dark:bg-gray-700" />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-full dark:bg-gray-700" />
                      <Skeleton className="h-3 w-32 mt-1 dark:bg-gray-700" />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-16 dark:bg-gray-700" />
                      <Skeleton className="h-3 w-20 mt-1 dark:bg-gray-700" />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-1">
                        <Skeleton className="h-8 w-8 rounded-full dark:bg-gray-700" />
                        <Skeleton className="h-8 w-8 rounded-full dark:bg-gray-700" />
                        <Skeleton className="h-8 w-8 rounded-full dark:bg-gray-700" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredCampaigns.map((campaign: any) => (
                  <tr key={campaign.id}>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-primary-100 dark:bg-primary-900 rounded-md flex items-center justify-center text-primary-700 dark:text-primary-300">
                          {getCampaignIcon(campaign.name)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{campaign.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Affiliate Program: {campaign.affiliateProgramName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {campaign.targetSubreddits?.join(", ") || "No subreddits"}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div>{formatSchedule(campaign).primary}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{formatSchedule(campaign).secondary}</div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-2 text-sm font-medium dark:text-gray-200">{campaign.metrics.performance}%</div>
                        <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <Progress 
                            value={campaign.metrics.performance} 
                            className={`h-2 rounded-full ${
                              campaign.metrics.performance > 80 ? "bg-success-500" :
                              campaign.metrics.performance > 40 ? "bg-primary-400" :
                              "bg-danger-500"
                            }`}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {campaign.metrics.clicks} clicks / {campaign.metrics.conversions} conversions
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${formatROI(campaign.metrics.roi).className} dark:text-success-400`}>
                        {formatROI(campaign.metrics.roi).value}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">${campaign.metrics.revenue.toFixed(2)}</div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center space-x-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/campaigns/${campaign.id}`}>
                            <Edit className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/analytics?campaignId=${campaign.id}`}>
                            <BarChart2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleCampaignStatus(campaign)}>
                              {campaign.status === "active" ? "Pause Campaign" : "Activate Campaign"}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/content-library?campaignId=${campaign.id}`}>
                                Generate Content
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/scheduling?campaignId=${campaign.id}`}>
                                Schedule Posts
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {Math.min(filteredCampaigns.length, 4)} of {filteredCampaigns.length} campaigns
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" className="hover:bg-gray-100 dark:hover:bg-gray-700" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive className="dark:bg-primary-800 dark:text-white">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" className="hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" className="hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis className="dark:text-gray-400" />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" className="hover:bg-gray-100 dark:hover:bg-gray-700" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignTable;
