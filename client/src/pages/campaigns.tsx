import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  PlusCircle, 
  Search, 
  Filter,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CampaignForm from "@/components/campaigns/CampaignForm";

const Campaigns = () => {
  const [_, params] = useRoute("/campaigns/:id");
  const [__, newRoute] = useRoute("/campaigns/new");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");

  // Fetch data
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns'],
  });

  const { data: affiliatePrograms } = useQuery({
    queryKey: ['/api/affiliate-programs'],
  });

  // If we're on the edit route, show the form
  if (params?.id) {
    return <CampaignForm campaignId={params.id} />;
  }

  // If we're on the new route, show the form
  if (newRoute) {
    return <CampaignForm />;
  }

  // Filter campaigns
  const filteredCampaigns = !campaignsLoading && campaigns
    ? campaigns
        .filter((campaign: any) => 
          campaign.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter((campaign: any) => 
          statusFilter === "all" || campaign.status === statusFilter)
        .filter((campaign: any) => 
          programFilter === "all" || campaign.affiliateProgramId.toString() === programFilter)
    : [];

  // Get status counts for tabs
  const getStatusCount = (status: string) => {
    if (campaignsLoading || !campaigns) return 0;
    return status === "all" 
      ? campaigns.length 
      : campaigns.filter((c: any) => c.status === status).length;
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-primary-800">Campaigns</h1>
          <p className="text-gray-600">Manage your affiliate marketing campaigns</p>
        </div>
        <Button className="mt-3 sm:mt-0" asChild>
          <Link href="/campaigns/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"/>
          <Input
            placeholder="Search campaigns..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2 w-full md:w-auto">
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Sort by Name</DropdownMenuItem>
              <DropdownMenuItem>Sort by Date</DropdownMenuItem>
              <DropdownMenuItem>Sort by Performance</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Tabs defaultValue="all" onValueChange={setStatusFilter} value={statusFilter}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-2">{getStatusCount("all")}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            <Badge variant="secondary" className="ml-2">{getStatusCount("active")}</Badge>
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused
            <Badge variant="secondary" className="ml-2">{getStatusCount("paused")}</Badge>
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled
            <Badge variant="secondary" className="ml-2">{getStatusCount("scheduled")}</Badge>
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft
            <Badge variant="secondary" className="ml-2">{getStatusCount("draft")}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaignsLoading ? (
              // Loading skeletons
              Array(6).fill(0).map((_, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-2/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-2" />
                    <Skeleton className="h-4 w-4/6" />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </CardFooter>
                </Card>
              ))
            ) : filteredCampaigns.length > 0 ? (
              // Campaign cards
              filteredCampaigns.map((campaign: any) => (
                <Card key={campaign.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <CardDescription>
                      {getProgramName(campaign.affiliateProgramId, affiliatePrograms)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                      {campaign.description || "No description provided"}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {campaign.targetSubreddits?.slice(0, 3).map((subreddit: string) => (
                        <Badge key={subreddit} variant="secondary">{subreddit}</Badge>
                      ))}
                      {campaign.targetSubreddits?.length > 3 && (
                        <Badge variant="outline">+{campaign.targetSubreddits.length - 3}</Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" asChild>
                      <Link href={`/analytics?campaignId=${campaign.id}`}>
                        Analytics
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href={`/campaigns/${campaign.id}`}>
                        Edit
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              // No results
              <div className="col-span-full text-center p-8">
                <div className="mx-auto mb-4 bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center">
                  <Filter className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold">No campaigns found</h3>
                <p className="text-gray-500 mt-1">
                  Try adjusting your filters or create a new campaign
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/campaigns/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Campaign
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* The same content is repeated for each tab, just with different filters applied */}
        <TabsContent value="active">
          {/* This is handled by the statusFilter state */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Same content as "all" tab */}
          </div>
        </TabsContent>
        
        <TabsContent value="paused">
          {/* This is handled by the statusFilter state */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Same content as "all" tab */}
          </div>
        </TabsContent>
        
        <TabsContent value="scheduled">
          {/* This is handled by the statusFilter state */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Same content as "all" tab */}
          </div>
        </TabsContent>
        
        <TabsContent value="draft">
          {/* This is handled by the statusFilter state */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Same content as "all" tab */}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

// Helper to get program name from ID
function getProgramName(id: number, programs: any[] | undefined): string {
  if (!programs) return "Loading...";
  const program = programs.find(p => p.id === id);
  return program ? program.name : "Unknown Program";
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    case "paused":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Paused</Badge>;
    case "scheduled":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Scheduled</Badge>;
    case "draft":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default Campaigns;
