import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  ArrowDownCircle, 
  Loader2, 
  RefreshCw, 
  Target 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchLiveOpportunities, getRedditAuthStatus } from "@/lib/api";

const RedditOpportunityFetcher = () => {
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(false);
  const [subredditInput, setSubredditInput] = useState<string>("");
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>([]);
  const [redditFetchMode, setRedditFetchMode] = useState<'new' | 'hot' | 'top' | 'rising'>('hot');
  const [redditFetchLimit, setRedditFetchLimit] = useState<number>(10);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check Reddit auth status
  const { data: authStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/auth/reddit/status'],
    queryFn: getRedditAuthStatus
  });

  // Mutation for fetching live opportunities
  const fetchLiveOpportunitiesMutation = useMutation({
    mutationFn: fetchLiveOpportunities,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
      setIsFetchingLive(false);
      toast({
        title: "Live Data Fetched",
        description: `Found ${data.length || 0} new opportunities from Reddit.`,
      });
    },
    onError: (error) => {
      setIsFetchingLive(false);
      toast({
        title: "Fetch Failed",
        description: "Failed to fetch live Reddit data. Please check Reddit API credentials.",
        variant: "destructive",
      });
    }
  });

  // Add subreddit to list
  const handleAddSubreddit = () => {
    if (!subredditInput.trim()) return;
    
    // Clean subreddit name (remove r/ prefix if present)
    let cleanSubreddit = subredditInput.trim();
    if (cleanSubreddit.startsWith('r/')) {
      cleanSubreddit = cleanSubreddit.substring(2);
    }
    
    // Check if already in list
    if (selectedSubreddits.includes(cleanSubreddit)) {
      toast({
        title: "Duplicate Subreddit",
        description: `${cleanSubreddit} is already in your list.`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedSubreddits([...selectedSubreddits, cleanSubreddit]);
    setSubredditInput("");
  };

  // Remove subreddit from list
  const handleRemoveSubreddit = (subreddit: string) => {
    setSelectedSubreddits(selectedSubreddits.filter(s => s !== subreddit));
  };

  // Fetch live opportunities
  const handleFetchOpportunities = () => {
    if (selectedSubreddits.length === 0) {
      toast({
        title: "No Subreddits Selected",
        description: "Please select at least one subreddit to fetch opportunities from.",
        variant: "destructive",
      });
      return;
    }
    
    setIsFetchingLive(true);
    fetchLiveOpportunitiesMutation.mutate({
      subreddits: selectedSubreddits,
      mode: redditFetchMode,
      limit: redditFetchLimit
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2 text-blue-500" />
          Reddit Opportunity Fetcher
        </CardTitle>
        <CardDescription>
          Fetch real-time opportunities from Reddit to discover potential affiliate marketing targets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!authStatus?.authenticated && !statusLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Reddit Authentication Required</AlertTitle>
            <AlertDescription>
              You need to authenticate with Reddit before fetching opportunities.
              <Button variant="link" className="p-0 h-auto" asChild>
                <a href="/settings">Go to Settings</a>
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="subreddit-input">Add Subreddits</Label>
          <div className="flex space-x-2">
            <Input
              id="subreddit-input"
              placeholder="Enter subreddit name (e.g. webdev)"
              value={subredditInput}
              onChange={(e) => setSubredditInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubreddit();
                }
              }}
            />
            <Button
              variant="outline"
              onClick={handleAddSubreddit}
              disabled={!subredditInput.trim()}
            >
              Add
            </Button>
          </div>
        </div>
        
        {selectedSubreddits.length > 0 && (
          <div>
            <Label>Selected Subreddits</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedSubreddits.map((subreddit) => (
                <Badge key={subreddit} variant="secondary" className="flex items-center gap-1">
                  r/{subreddit}
                  <button
                    onClick={() => handleRemoveSubreddit(subreddit)}
                    className="ml-1 h-4 w-4 rounded-full bg-muted/30 inline-flex items-center justify-center hover:bg-muted"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fetch-mode">Sort Mode</Label>
            <Select
              value={redditFetchMode}
              onValueChange={(value: 'new' | 'hot' | 'top' | 'rising') => setRedditFetchMode(value)}
            >
              <SelectTrigger id="fetch-mode">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="rising">Rising</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fetch-limit">Result Limit</Label>
            <Select
              value={redditFetchLimit.toString()}
              onValueChange={(value) => setRedditFetchLimit(parseInt(value))}
            >
              <SelectTrigger id="fetch-limit">
                <SelectValue placeholder="Select limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 posts</SelectItem>
                <SelectItem value="10">10 posts</SelectItem>
                <SelectItem value="25">25 posts</SelectItem>
                <SelectItem value="50">50 posts</SelectItem>
                <SelectItem value="100">100 posts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleFetchOpportunities}
          disabled={isFetchingLive || selectedSubreddits.length === 0 || !authStatus?.authenticated}
        >
          {isFetchingLive ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching Reddit Data...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Fetch New Opportunities
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RedditOpportunityFetcher;