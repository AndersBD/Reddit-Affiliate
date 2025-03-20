import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  MessageSquare, 
  Bell, 
  Wand2,
  BarChart2,
  Clock,
  Calendar
} from "lucide-react";

interface Activity {
  id: number;
  campaignId: number;
  type: string;
  message: string;
  details: any;
  timestamp: string;
}

const RecentActivity = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['/api/activities'],
  });

  // Get the appropriate icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post_published':
        return <CheckCircle className="text-green-600 h-3 w-3" />;
      case 'comments_received':
        return <MessageSquare className="text-blue-600 h-3 w-3" />;
      case 'campaign_paused':
        return <Bell className="text-yellow-600 h-3 w-3" />;
      case 'content_generated':
        return <Wand2 className="text-purple-600 h-3 w-3" />;
      case 'post_scheduled':
        return <Calendar className="text-blue-600 h-3 w-3" />;
      case 'metrics_updated':
        return <BarChart2 className="text-green-600 h-3 w-3" />;
      default:
        return <Clock className="text-gray-600 h-3 w-3" />;
    }
  };

  // Get the background color for activity type
  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'post_published':
        return 'bg-green-100';
      case 'comments_received':
        return 'bg-blue-100';
      case 'campaign_paused':
        return 'bg-yellow-100';
      case 'content_generated':
        return 'bg-purple-100';
      case 'post_scheduled':
        return 'bg-blue-100';
      case 'metrics_updated':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return days === 1 ? 'Yesterday' : `${days} days ago`;
    }
  };

  return (
    <Card className="fade-in" style={{ animationDelay: "1s" }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-primary-800">Recent Activity</h3>
          <Button variant="link" className="text-primary-600 text-sm p-0">View All</Button>
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array(4).fill(0).map((_, index) => (
              <div className="flex items-start" key={index}>
                <Skeleton className="flex-shrink-0 w-8 h-8 rounded-full mr-3" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-12" />
              </div>
            ))
          ) : (
            // Actual activities
            activities?.map((activity: Activity) => (
              <div className="flex items-start" key={activity.id}>
                <div className={`flex-shrink-0 ${getActivityBgColor(activity.type)} rounded-full p-2 mr-3`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="text-sm" dangerouslySetInnerHTML={{ __html: formatActivityMessage(activity.message) }} />
                  <div className="text-xs text-gray-500 mt-0.5">
                    {formatRelativeTime(activity.timestamp)}
                  </div>
                </div>
                <div>
                  <Button variant="link" className="text-primary-600 text-sm p-0">View</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper to format activity message with bold parts
function formatActivityMessage(message: string): string {
  // Find items in quotes or keywords that should be bold
  return message.replace(/"([^"]+)"/g, '<span class="font-medium">$1</span>')
    .replace(/campaign was/g, '<span class="font-medium">campaign</span> was')
    .replace(/post was/g, '<span class="font-medium">post</span> was')
    .replace(/comments on thread/g, 'comments on <span class="font-medium">thread</span>');
}

export default RecentActivity;
