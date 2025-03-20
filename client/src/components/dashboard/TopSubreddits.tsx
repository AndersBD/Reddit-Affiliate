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
    <Card className="fade-in bg-white dark:bg-gray-800 dark:border-gray-700" style={{ animationDelay: "0.5s" }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-primary-800 dark:text-primary-300">Top Subreddits</h3>
          <button type="button" className="text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
            View All
          </button>
        </div>
        
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeleton
            Array(5).fill(0).map((_, index) => (
              <div className="flex items-center justify-between" key={index}>
                <div className="flex items-center">
                  <Skeleton className="w-8 h-8 rounded-full dark:bg-gray-700" />
                  <Skeleton className="ml-2 h-4 w-24 dark:bg-gray-700" />
                </div>
                <Skeleton className="h-4 w-16 dark:bg-gray-700" />
              </div>
            ))
          ) : (
            // Actual data
            topSubreddits?.map((subreddit: SubredditData) => (
              <div className="flex items-center justify-between" key={subreddit.subreddit}>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">r/</span>
                  </div>
                  <span className="ml-2 text-sm font-medium dark:text-gray-200">{subreddit.subreddit}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-primary-800 dark:text-primary-300">{subreddit.clicks.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">clicks</span>
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
