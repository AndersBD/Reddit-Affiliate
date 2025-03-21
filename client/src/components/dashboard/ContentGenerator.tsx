import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wand2 } from "lucide-react";
import { generateContent, createRedditPost } from "@/lib/api";

const ContentGenerator = () => {
  const [campaignId, setCampaignId] = useState<string>("");
  const [subredditName, setSubredditName] = useState<string>("");
  const [contentType, setContentType] = useState<"post" | "comment">("post");
  const [productFocus, setProductFocus] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get campaigns data
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns'],
  });

  // Content generation mutation
  const generateContentMutation = useMutation({
    mutationFn: generateContent,
    onSuccess: (data) => {
      toast({
        title: "Content Generated",
        description: "Your content has been successfully generated.",
      });
      
      // Save the generated content as a draft in the database
      if (campaignId) {
        createRedditPostMutation.mutate({
          campaignId: parseInt(campaignId),
          subredditName,
          title: data.title,
          content: data.content,
          status: "draft",
          postType: contentType,
          affiliateLink: "",
        });
      }
      
      setIsGenerating(false);
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "There was an error generating content. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  });

  // Create Reddit post mutation
  const createRedditPostMutation = useMutation({
    mutationFn: createRedditPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reddit-posts'] });
    }
  });

  // Get subreddits based on selected campaign
  const getSubredditsForCampaign = () => {
    if (!campaignId || !campaigns) return [];
    
    const campaign = campaigns.find((c: any) => c.id.toString() === campaignId);
    return campaign?.targetSubreddits || [];
  };
  
  const handleGenerateContent = () => {
    if (!campaignId || !subredditName) {
      toast({
        title: "Incomplete Form",
        description: "Please select both a campaign and a subreddit.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    generateContentMutation.mutate({
      campaignId: parseInt(campaignId),
      subredditName,
      contentType,
      productFocus: productFocus || undefined,
    });
  };

  return (
    <Card className="fade-in bg-white dark:bg-gray-800" style={{ animationDelay: "0.7s" }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">AI Content Generator</h3>
          <Badge variant="outline" className="bg-green-100 text-green-700">Ready</Badge>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Generate human-like Reddit posts and comments for your campaigns.
        </p>
        
        <div className="mb-4">
          <Label className="block text-sm font-medium text-gray-700 mb-1">Campaign</Label>
          <Select value={campaignId} onValueChange={setCampaignId}>
            <SelectTrigger className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              {!campaignsLoading && campaigns?.map((campaign: any) => (
                <SelectItem key={campaign.id} value={campaign.id.toString()}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {campaignId && (
          <div className="mb-4">
            <Label className="block text-sm font-medium text-gray-700 mb-1">Subreddit</Label>
            <Select value={subredditName} onValueChange={setSubredditName}>
              <SelectTrigger className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5">
                <SelectValue placeholder="Select subreddit" />
              </SelectTrigger>
              <SelectContent>
                {getSubredditsForCampaign().map((subreddit: string) => (
                  <SelectItem key={subreddit} value={subreddit}>
                    {subreddit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="mb-4">
          <Label className="block text-sm font-medium text-gray-700 mb-1">Content Type</Label>
          <div className="flex space-x-2">
            <Button 
              variant={contentType === "post" ? "default" : "outline"}
              className="flex-1" 
              onClick={() => setContentType("post")}
            >
              Post
            </Button>
            <Button 
              variant={contentType === "comment" ? "default" : "outline"}
              className="flex-1" 
              onClick={() => setContentType("comment")}
            >
              Comment
            </Button>
          </div>
        </div>
        
        <Button 
          className="w-full bg-primary-500 hover:bg-primary-600"
          onClick={handleGenerateContent}
          disabled={isGenerating || !campaignId || !subredditName}
        >
          <Wand2 className="mr-2 h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate Content"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ContentGenerator;
