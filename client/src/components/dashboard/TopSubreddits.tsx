import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface SubredditData {
  subreddit: string;
  clicks: number;
}

const TopSubreddits = () => {
  const { data: topSubreddits, isLoading } = useQuery({
    queryKey: ['/api/top-subreddits'],
  });

  return (
    <Card className="fade-in" style={{ animationDelay: "0.5s" }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-primary-800">Top Subreddits</h3>
          <button type="button" className="text-xs text-primary-600 hover:text-primary-800">
            View All
          </button>
        </div>
        
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeleton
            Array(5).fill(0).map((_, index) => (
              <div className="flex items-center justify-between" key={index}>
                <div className="flex items-center">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="ml-2 h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))
          ) : (
            // Actual data
            topSubreddits?.map((subreddit: SubredditData) => (
              <div className="flex items-center justify-between" key={subreddit.subreddit}>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary-700">r/</span>
                  </div>
                  <span className="ml-2 text-sm font-medium">{subreddit.subreddit}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-primary-800">{subreddit.clicks.toLocaleString()}</span>
                  <span className="text-xs text-gray-500">clicks</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopSubreddits;
