import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { 
  Calendar, 
  PlusCircle, 
  Clock,
  RotateCcw,
  Loader2 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SchedulingCalendar from "@/components/scheduling/SchedulingCalendar";
import ScheduleForm from "@/components/scheduling/ScheduleForm";

const Scheduling = () => {
  const [matchParams, params] = useRoute("/scheduling/:id");
  const [matchNew] = useRoute("/scheduling/new");
  const [selectedView, setSelectedView] = useState<string>("calendar");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [location] = useLocation();

  // Get URL parameter
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const campaignIdParam = searchParams.get('campaignId');

  // Set the selected campaign from URL parameter
  useState(() => {
    if (campaignIdParam && !selectedCampaign) {
      setSelectedCampaign(campaignIdParam);
    }
  });

  // Fetch data
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns'],
  });

  const { data: scheduledPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['/api/scheduled-posts'],
  });

  // Filter posts by selected campaign
  const filteredPosts = !postsLoading && scheduledPosts
    ? selectedCampaign 
      ? scheduledPosts.filter((post: any) => 
          post.campaignId.toString() === selectedCampaign)
      : scheduledPosts
    : [];

  // If editing a specific post
  if (matchParams && params.id !== "new") {
    return <ScheduleForm postId={params.id} />;
  }

  // If creating a new scheduled post
  if (matchNew) {
    return <ScheduleForm />;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-primary-800">Scheduling</h1>
          <p className="text-gray-600">Plan and schedule your Reddit posts for optimal engagement</p>
        </div>
        <Button className="mt-3 sm:mt-0" asChild>
          <a href="/scheduling/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Schedule New Post
          </a>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4 mb-4">
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Campaigns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Campaigns</SelectItem>
            {!campaignsLoading && campaigns?.map((campaign: any) => (
              <SelectItem key={campaign.id} value={campaign.id.toString()}>
                {campaign.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex-1 flex justify-end">
          <Tabs value={selectedView} onValueChange={setSelectedView} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calendar">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </TabsTrigger>
              <TabsTrigger value="list">
                <Clock className="h-4 w-4 mr-2" />
                List View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {postsLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading schedule data...</span>
        </div>
      ) : (
        <Tabs value={selectedView} onValueChange={setSelectedView}>
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Posting Calendar</CardTitle>
                <CardDescription>
                  View and manage your scheduled Reddit posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SchedulingCalendar posts={filteredPosts} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Posts</CardTitle>
                <CardDescription>
                  Chronological list of your upcoming Reddit posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredPosts.length > 0 ? (
                  <div className="space-y-4">
                    {filteredPosts
                      .sort((a: any, b: any) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                      .map((post: any) => (
                        <Card key={post.id} className="overflow-hidden">
                          <div className="border-l-4 border-primary-500 pl-4 py-3 pr-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-base">{post.title || "Comment"}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-sm text-gray-500">{post.subreddit}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {getCampaignName(post.campaignId, campaigns)}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-medium">{formatScheduleTime(post.scheduledTime)}</span>
                                <span className="text-xs text-gray-500">{formatScheduleDate(post.scheduledTime)}</span>
                              </div>
                            </div>
                            <div className="flex justify-end mt-2 space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <a href={`/content-library/${post.id}`}>
                                  View Content
                                </a>
                              </Button>
                              <Button size="sm" asChild>
                                <a href={`/scheduling/${post.id}`}>
                                  Edit Schedule
                                </a>
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <RotateCcw className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium">No scheduled posts</h3>
                    <p className="text-gray-500 mt-1 mb-4">
                      You don't have any posts scheduled at the moment
                    </p>
                    <Button asChild>
                      <a href="/scheduling/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Schedule a Post
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </>
  );
};

// Helper functions
function getCampaignName(campaignId: number, campaigns: any[] | undefined): string {
  if (!campaigns) return "Loading...";
  const campaign = campaigns.find(c => c.id === campaignId);
  return campaign ? campaign.name : "Unknown Campaign";
}

function formatScheduleTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatScheduleDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

export default Scheduling;
