import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Edit, CalendarPlus } from "lucide-react";
import { Link } from "wouter";

interface ScheduledPost {
  id: number;
  title: string;
  scheduledTime: string;
  subreddit: string;
  campaignId: number;
  campaignName?: string;
}

const ScheduleManager = () => {
  const { data: scheduledPosts, isLoading } = useQuery({
    queryKey: ['/api/scheduled-posts'],
  });

  const { data: campaigns } = useQuery({
    queryKey: ['/api/campaigns'],
  });

  // Today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Tomorrow's date at midnight
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Process scheduled posts
  const processedPosts = !isLoading && scheduledPosts && campaigns 
    ? scheduledPosts.map((post: ScheduledPost) => {
        // Add campaign name
        const campaign = campaigns.find((c: any) => c.id === post.campaignId);
        
        // Check if the scheduled time is today or tomorrow
        const postDate = new Date(post.scheduledTime);
        let timeDisplay = "";
        
        if (postDate >= today && postDate < tomorrow) {
          timeDisplay = `Today, ${formatTime(postDate)}`;
        } else if (postDate >= tomorrow && postDate < new Date(tomorrow.getTime() + 86400000)) {
          timeDisplay = `Tomorrow, ${formatTime(postDate)}`;
        } else {
          timeDisplay = formatDate(postDate);
        }
        
        return {
          ...post,
          campaignName: campaign?.name || "Unknown Campaign",
          timeDisplay,
          isToday: postDate >= today && postDate < tomorrow
        };
      })
    : [];

  // Sort posts by scheduled time
  const sortedPosts = [...(processedPosts || [])].sort((a, b) => {
    return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
  });

  // Helper function to format time
  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Helper function to format date
  function formatDate(date: Date): string {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
           ", " + formatTime(date);
  }

  return (
    <Card className="fade-in" style={{ animationDelay: "0.8s" }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-primary-800">Schedule Posts</h3>
          <Badge className="bg-blue-100 text-blue-700">
            {isLoading ? "Loading..." : `${sortedPosts.length} pending`}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Upcoming scheduled posts across all campaigns.
        </p>
        
        <div className="space-y-3 max-h-[200px] overflow-y-auto">
          {isLoading ? (
            // Loading skeleton
            Array(4).fill(0).map((_, index) => (
              <div className="flex items-start border-l-4 border-gray-300 pl-3 py-1" key={index}>
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex space-x-1">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            ))
          ) : sortedPosts.length > 0 ? (
            // Actual data
            sortedPosts.map((post) => (
              <div 
                className={`flex items-start border-l-4 ${
                  post.isToday ? 'border-primary-400' : 'border-gray-300'
                } pl-3 py-1`}
                key={post.id}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{post.campaignName}</div>
                  <div className="text-xs text-gray-500">{post.subreddit} - {post.timeDisplay}</div>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                    <Link href={`/content-library/${post.id}`}>
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                    <Link href={`/scheduling/${post.id}`}>
                      <Edit className="h-4 w-4 text-gray-500" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No scheduled posts yet</p>
            </div>
          )}
        </div>
        
        <Button 
          variant="outline" 
          className="w-full mt-4 flex items-center justify-center"
          asChild
        >
          <Link href="/scheduling/new">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Schedule New Post
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ScheduleManager;
