import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute, Link } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Filter, 
  PlusCircle, 
  Wand2, 
  Save, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  RefreshCw,
  Target,
  Star,
  MessageSquare,
  FileText,
  ArrowUpRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  generateContent, 
  createRedditPost, 
  updateRedditPost, 
  checkContentCompliance,
  createKeyword,
  deleteKeyword,
  updateOpportunity,
  fetchLiveOpportunities,
  analyzeOpportunities,
  triggerOpportunityScan,
  createContentQueueItem, 
  schedulePost 
} from "@/lib/api";

const ContentLibrary = () => {
  const [_, params] = useRoute("/content-library/:id");
  const [location, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>("");
  const [contentType, setContentType] = useState<"post" | "comment">("post");
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [opportunitiesTabsValue, setOpportunitiesTabsValue] = useState<string>("all");
  
  // Additional state for opportunities tab
  const [newKeyword, setNewKeyword] = useState<string>("");
  const [isAddingKeyword, setIsAddingKeyword] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['/api/reddit-posts'],
  });

  const { data: contentTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/content-templates'],
  });
  
  const { data: keywords, isLoading: keywordsLoading } = useQuery({
    queryKey: ['/api/keywords'],
  });
  
  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery({
    queryKey: ['/api/opportunities'],
  });
  
  const { data: contentQueue, isLoading: contentQueueLoading } = useQuery({
    queryKey: ['/api/content-queue'],
  });

  // Load post data if we're on the edit route
  const { data: postData, isLoading: postLoading } = useQuery({
    queryKey: ['/api/reddit-posts', params?.id],
    enabled: !!params?.id,
  });

  // Set form fields when loading existing post
  useState(() => {
    if (postData && !postLoading) {
      setTitle(postData.title || "");
      setContent(postData.content || "");
      setContentType(postData.postType || "post");
      setSelectedCampaign(postData.campaignId.toString());
      setSelectedSubreddit(postData.subredditName);
    }
  });

  // Get subreddits based on selected campaign
  const getSubredditsForCampaign = () => {
    if (!selectedCampaign || !campaigns) return [];
    
    const campaign = campaigns.find((c: any) => c.id.toString() === selectedCampaign);
    return campaign?.targetSubreddits || [];
  };

  // Filter posts
  const filteredPosts = !postsLoading && posts
    ? posts
        .filter((post: any) => 
          (post.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter((post: any) => 
          !selectedCampaign || post.campaignId.toString() === selectedCampaign)
    : [];

  // Mutations
  const generateContentMutation = useMutation({
    mutationFn: generateContent,
    onSuccess: (data) => {
      setTitle(data.title);
      setContent(data.content);
      setIsGenerating(false);
      toast({
        title: "Content Generated",
        description: "AI content has been generated successfully.",
      });
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    }
  });

  const createPostMutation = useMutation({
    mutationFn: createRedditPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reddit-posts'] });
      toast({
        title: "Post Saved",
        description: "Your post has been saved successfully.",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "Failed to save your post. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateRedditPost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reddit-posts'] });
      toast({
        title: "Post Updated",
        description: "Your post has been updated successfully.",
      });
      navigate("/content-library");
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update your post. Please try again.",
        variant: "destructive",
      });
    }
  });

  const checkComplianceMutation = useMutation({
    mutationFn: checkContentCompliance,
    onSuccess: (data) => {
      setComplianceResult(data);
      setIsChecking(false);
      toast({
        title: data.compliant ? "Content is Compliant" : "Compliance Issues Found",
        description: data.compliant 
          ? "Your content meets Reddit's guidelines." 
          : `Found ${data.issues.length} issue(s). Please review and fix.`,
        variant: data.compliant ? "default" : "destructive",
      });
    },
    onError: (error) => {
      setIsChecking(false);
      toast({
        title: "Compliance Check Failed",
        description: "Could not check compliance. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Keywords mutations
  const createKeywordMutation = useMutation({
    mutationFn: createKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
      setNewKeyword("");
      toast({
        title: "Keyword Added",
        description: "The keyword has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Keyword",
        description: "Could not add the keyword. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const deleteKeywordMutation = useMutation({
    mutationFn: deleteKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
      toast({
        title: "Keyword Deleted",
        description: "The keyword has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete Keyword",
        description: "Could not delete the keyword. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Opportunity mutations
  const updateOpportunityMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateOpportunity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content-queue'] });
      toast({
        title: "Opportunity Updated",
        description: "The opportunity has been processed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Process Opportunity",
        description: "Could not process the opportunity. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const triggerOpportunityScanMutation = useMutation({
    mutationFn: triggerOpportunityScan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
      toast({
        title: "Scan Initiated",
        description: "Opportunity scan has been initiated. New opportunities will appear shortly.",
      });
    },
    onError: (error) => {
      toast({
        title: "Scan Failed",
        description: "Could not initiate opportunity scan. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const createQueueItemMutation = useMutation({
    mutationFn: createContentQueueItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content-queue'] });
      toast({
        title: "Added to Queue",
        description: "The item has been added to the content queue.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add to Queue",
        description: "Could not add to content queue. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Generate content
  const handleGenerateContent = () => {
    if (!selectedCampaign || !selectedSubreddit) {
      toast({
        title: "Missing Information",
        description: "Please select a campaign and subreddit first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    generateContentMutation.mutate({
      campaignId: parseInt(selectedCampaign),
      subredditName: selectedSubreddit,
      contentType: contentType,
    });
  };

  // Save content
  const handleSaveContent = () => {
    if (!selectedCampaign || !selectedSubreddit || !content || (contentType === "post" && !title)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    const postData = {
      campaignId: parseInt(selectedCampaign),
      subredditName: selectedSubreddit,
      title: title,
      content: content,
      postType: contentType,
      status: "draft",
    };
    
    if (params?.id) {
      updatePostMutation.mutate({ id: parseInt(params.id), data: postData });
    } else {
      createPostMutation.mutate(postData);
    }
  };

  // Schedule content
  const handleScheduleContent = () => {
    if (!selectedCampaign || !selectedSubreddit || !content || (contentType === "post" && !title)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Save first, then redirect to scheduling page
    const postData = {
      campaignId: parseInt(selectedCampaign),
      subredditName: selectedSubreddit,
      title: title,
      content: content,
      postType: contentType,
      status: "draft",
    };
    
    if (params?.id) {
      // If editing, update then redirect
      updatePostMutation.mutate({ 
        id: parseInt(params.id), 
        data: postData 
      }, {
        onSuccess: () => {
          navigate(`/scheduling/${params.id}`);
        }
      });
    } else {
      // If new, create then redirect
      createPostMutation.mutate(postData, {
        onSuccess: (newPost) => {
          navigate(`/scheduling/${newPost.id}`);
        }
      });
    }
  };

  // Check compliance
  const handleCheckCompliance = () => {
    if (!selectedSubreddit || !content) {
      toast({
        title: "Missing Information",
        description: "Please add content and select a subreddit to check compliance.",
        variant: "destructive",
      });
      return;
    }
    
    setIsChecking(true);
    checkComplianceMutation.mutate({
      content: contentType === "post" ? `${title}\n\n${content}` : content,
      subredditName: selectedSubreddit,
    });
  };

  // Reset form
  const resetForm = () => {
    setTitle("");
    setContent("");
    setComplianceResult(null);
  };
  
  // ========== Keyword & Opportunity Handlers ==========
  
  // Add a new keyword
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a keyword to add.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAddingKeyword(true);
    createKeywordMutation.mutate({
      keyword: newKeyword.trim(),
      status: "active",
      campaignId: selectedCampaign ? parseInt(selectedCampaign) : null,
    }, {
      onSettled: () => {
        setIsAddingKeyword(false);
      }
    });
  };
  
  // Delete keyword
  const handleDeleteKeyword = (id: number) => {
    deleteKeywordMutation.mutate(id);
  };
  
  // Process opportunity
  const handleProcessOpportunity = (opportunity: any) => {
    updateOpportunityMutation.mutate({
      id: opportunity.id,
      data: {
        status: "queued"
      }
    });
    
    // Add to content queue
    createQueueItemMutation.mutate({
      opportunityId: opportunity.id,
      content: "",
      type: opportunity.actionType || "comment",
      subreddit: opportunity.subreddit,
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Schedule for tomorrow
      status: "pending",
      campaignId: selectedCampaign ? parseInt(selectedCampaign) : null,
    });
  };
  
  // Ignore opportunity
  const handleIgnoreOpportunity = (opportunityId: number) => {
    updateOpportunityMutation.mutate({
      id: opportunityId,
      data: {
        status: "ignored"
      }
    });
  };
  
  // Trigger opportunity scan
  const handleTriggerScan = () => {
    setIsScanning(true);
    triggerOpportunityScanMutation.mutate(null, {
      onSettled: () => {
        setIsScanning(false);
      }
    });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-primary-800">Content Library</h1>
          <p className="text-gray-600">Create and manage your Reddit content</p>
        </div>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="w-full">
          <TabsTrigger value="create" className="flex-1">Create Content</TabsTrigger>
          <TabsTrigger value="library" className="flex-1">Content Library</TabsTrigger>
          <TabsTrigger value="templates" className="flex-1">Content Templates</TabsTrigger>
          <TabsTrigger value="opportunities" className="flex-1">Opportunities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{params?.id ? "Edit Content" : "Create Content"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Campaign and Subreddit Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Campaign</Label>
                      <Select 
                        value={selectedCampaign} 
                        onValueChange={setSelectedCampaign}
                        disabled={!!params?.id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a campaign" />
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
                    
                    <div>
                      <Label>Subreddit</Label>
                      <Select 
                        value={selectedSubreddit} 
                        onValueChange={setSelectedSubreddit}
                        disabled={!!params?.id || !selectedCampaign}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subreddit" />
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
                  </div>
                  
                  {/* Content Type */}
                  <div>
                    <Label>Content Type</Label>
                    <div className="flex space-x-2 mt-1">
                      <Button 
                        variant={contentType === "post" ? "default" : "outline"}
                        className="flex-1" 
                        onClick={() => setContentType("post")}
                        disabled={!!params?.id}
                      >
                        Post
                      </Button>
                      <Button 
                        variant={contentType === "comment" ? "default" : "outline"}
                        className="flex-1" 
                        onClick={() => setContentType("comment")}
                        disabled={!!params?.id}
                      >
                        Comment
                      </Button>
                    </div>
                  </div>
                  
                  {/* Title (only for posts) */}
                  {contentType === "post" && (
                    <div>
                      <Label>Title</Label>
                      <Input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a compelling title"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div>
                    <Label>Content</Label>
                    <Textarea 
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your content here or generate with AI"
                      rows={8}
                    />
                  </div>
                  
                  {/* Compliance Result */}
                  {complianceResult && (
                    <div className={`p-4 rounded-md ${
                      complianceResult.compliant ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 rounded-full p-1 ${
                          complianceResult.compliant ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {complianceResult.compliant ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="ml-3">
                          <h4 className={`text-sm font-medium ${
                            complianceResult.compliant ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {complianceResult.compliant ? 'Content is compliant' : 'Compliance issues found'}
                          </h4>
                          
                          {!complianceResult.compliant && complianceResult.issues.length > 0 && (
                            <ul className="mt-1 text-xs text-red-700 list-disc list-inside">
                              {complianceResult.issues.map((issue: string, index: number) => (
                                <li key={index}>{issue}</li>
                              ))}
                            </ul>
                          )}
                          
                          {complianceResult.suggestions && (
                            <p className="mt-1 text-xs">
                              <strong>Suggestions:</strong> {complianceResult.suggestions}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={handleGenerateContent}
                      disabled={isGenerating || !selectedCampaign || !selectedSubreddit}
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      {isGenerating ? "Generating..." : "Generate with AI"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCheckCompliance}
                      disabled={isChecking || !content || !selectedSubreddit}
                    >
                      {isChecking ? "Checking..." : "Check Compliance"}
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveContent}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                    <Button variant="secondary" onClick={handleScheduleContent}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>AI Content Generator</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Our AI will generate high-quality, human-like content optimized for Reddit engagement
                    and compliant with subreddit rules.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Content Focus (Optional)</Label>
                      <Input 
                        placeholder="E.g., specific product feature" 
                        disabled={isGenerating || !selectedCampaign || !selectedSubreddit}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Specify what aspect of the product you want to focus on
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleGenerateContent}
                      disabled={isGenerating || !selectedCampaign || !selectedSubreddit}
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      {isGenerating ? "Generating..." : "Generate Content"}
                    </Button>
                  </div>
                  
                  <div className="border-t border-gray-200 mt-6 pt-4">
                    <h4 className="font-medium text-sm mb-2">Tips for Reddit Content</h4>
                    <ul className="text-xs space-y-1 text-gray-600 list-disc list-inside">
                      <li>Always provide value to the community first</li>
                      <li>Use a conversational, authentic tone</li>
                      <li>Ask questions to encourage engagement</li>
                      <li>Follow subreddit-specific rules</li>
                      <li>Mention your product naturally within the broader context</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="library">
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"/>
              <Input
                placeholder="Search content..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-[200px]">
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {postsLoading ? (
              // Loading skeletons
              Array(6).fill(0).map((_, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-2/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Skeleton className="h-8 w-16" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : filteredPosts.length > 0 ? (
              // Content cards
              filteredPosts.map((post: any) => (
                <Card key={post.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <CardTitle className="text-md">{post.title || "Comment"}</CardTitle>
                        <p className="text-xs text-gray-500">{post.subredditName}</p>
                      </div>
                      <StatusBadge status={post.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-3">{post.content}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Badge variant="outline">{post.postType}</Badge>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/content-library/${post.id}`}>
                          Edit
                        </Link>
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/scheduling/${post.id}`}>
                          Schedule
                        </Link>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              // No results
              <div className="col-span-full text-center p-8">
                <div className="mx-auto mb-4 bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center">
                  <Filter className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold">No content found</h3>
                <p className="text-gray-500 mt-1">
                  Try adjusting your search or create new content
                </p>
                <Button className="mt-4" onClick={() => navigate("/content-library")}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Content
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="opportunities">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Summary Cards */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Keywords Tracked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-2 rounded-full p-2 bg-blue-100">
                    <Target className="h-4 w-4 text-blue-700" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {keywordsLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        keywords?.length || 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Active monitoring</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">New Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-2 rounded-full p-2 bg-green-100">
                    <ArrowUpRight className="h-4 w-4 text-green-700" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {opportunitiesLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        opportunities?.filter((o: any) => o.status === 'new').length || 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Waiting for review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-2 rounded-full p-2 bg-orange-100">
                    <RefreshCw className="h-4 w-4 text-orange-700" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {opportunitiesLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        opportunities?.filter((o: any) => o.status === 'queued' || o.status === 'processing').length || 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Content being created</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-2 rounded-full p-2 bg-purple-100">
                    <CheckCircle className="h-4 w-4 text-purple-700" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {opportunitiesLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        opportunities?.filter((o: any) => o.status === 'completed').length || 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Ready for posting</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Content Opportunities</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Scanning for opportunities",
                    description: "Scanning Reddit for potential affiliate marketing opportunities...",
                  });
                  
                  // Call the API to trigger a scan
                  fetch('/api/opportunities/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keywordLimit: 10 })
                  })
                  .then(res => res.json())
                  .then(data => {
                    queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
                    
                    toast({
                      title: "Scan completed",
                      description: `Processed ${data.processedKeywords} keywords and found ${data.queuedCount} new opportunities.`,
                    });
                  })
                  .catch(err => {
                    toast({
                      title: "Scan failed",
                      description: "Failed to scan for new opportunities. Please try again.",
                      variant: "destructive",
                    });
                  });
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Scan for New
              </Button>
              <Button 
                size="sm"
                onClick={() => {
                  // Show dialog to add keyword
                  const keyword = window.prompt("Enter keyword to track:");
                  if (keyword) {
                    fetch('/api/keywords', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        keyword: keyword,
                        status: 'active',
                        priority: 'medium',
                        campaignId: selectedCampaign ? parseInt(selectedCampaign) : null
                      })
                    })
                    .then(res => res.json())
                    .then(data => {
                      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
                      toast({
                        title: "Keyword added",
                        description: `"${keyword}" has been added to your tracking list.`,
                      });
                    })
                    .catch(err => {
                      toast({
                        title: "Failed to add keyword",
                        description: "Could not add the keyword. Please try again.",
                        variant: "destructive",
                      });
                    });
                  }
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Keyword
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="all" className="mb-6" value={opportunitiesTabsValue} onValueChange={setOpportunitiesTabsValue}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="queued">Queued</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <div className="mt-2">
              {(() => {
                // Filter opportunities based on tab selection
                const filteredOpportunities = (() => {
                  if (opportunitiesTabsValue === "all") {
                    return opportunities;
                  } else {
                    return opportunities?.filter((opp: any) => opp.status === opportunitiesTabsValue);
                  }
                })();
                
                // Show count of filtered opportunities
                return (
                  <p className="text-sm text-gray-500">
                    Showing {filteredOpportunities?.length || 0} {opportunitiesTabsValue !== "all" ? opportunitiesTabsValue : ""} opportunities
                  </p>
                );
              })()}
            </div>
          </Tabs>
          
          <div className="space-y-4">
            {opportunitiesLoading ? (
              // Loading skeletons
              Array(3).fill(0).map((_, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <Skeleton className="h-5 w-48 mb-1" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <Skeleton className="h-12 w-full" />
                    <div className="flex justify-between mt-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end pt-2">
                    <Skeleton className="h-9 w-24 mr-2" />
                    <Skeleton className="h-9 w-24" />
                  </CardFooter>
                </Card>
              ))
            ) : opportunities?.length > 0 ? (
              // Opportunity cards - Filter based on selected tab
              opportunities
                .filter((opportunity: any) => 
                  opportunitiesTabsValue === "all" || opportunity.status === opportunitiesTabsValue
                )
                .map((opportunity: any) => (
                <Card key={opportunity.id} className={opportunity.status === 'new' ? 'border-l-4 border-l-blue-500' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="text-base font-semibold">{opportunity.title || 'Reddit Opportunity'}</h4>
                          <Badge variant={
                            opportunity.status === 'new' ? 'default' : 
                            opportunity.status === 'queued' ? 'outline' :
                            opportunity.status === 'processing' ? 'secondary' :
                            opportunity.status === 'completed' ? 'success' : 'outline'
                          } className="ml-2">
                            {opportunity.status}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Target className="h-3 w-3 mr-1" />
                          {opportunity.keyword}
                          <span className="mx-2">•</span>
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {opportunity.subreddit}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-semibold bg-amber-50">
                        <Star className="h-3 w-3 mr-1 text-amber-500" />
                        Score: {opportunity.opportunityScore || 0}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm line-clamp-2">
                      {opportunity.snippet || 'No description available'}
                    </p>
                    <div className="flex justify-between mt-3 text-xs text-gray-500">
                      <div>
                        <BarChart3 className="h-3 w-3 inline mr-1" />
                        {opportunity.rank ? `Rank: ${opportunity.rank}` : 'Rank: N/A'}
                      </div>
                      <div>
                        <FileText className="h-3 w-3 inline mr-1" />
                        Action type: {opportunity.actionType || 'Comment'}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-end">
                    <Button variant="outline" size="sm" className="mr-2">
                      <a href={opportunity.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                        View on Reddit
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (opportunity.status === 'new') {
                          toast({
                            title: "Processing opportunity",
                            description: "Generating content for this opportunity...",
                          });
                          
                          // Update the opportunity status
                          fetch(`/api/opportunities/${opportunity.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              status: 'processing' 
                            })
                          })
                          .then(res => res.json())
                          .then(() => {
                            // Trigger content generation for this specific opportunity
                            return fetch('/api/opportunities/process', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                            });
                          })
                          .then(res => res.json())
                          .then(data => {
                            queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
                            queryClient.invalidateQueries({ queryKey: ['/api/content-queue'] });
                            
                            toast({
                              title: "Content generated",
                              description: "Content has been generated and added to your queue.",
                            });
                          })
                          .catch(err => {
                            toast({
                              title: "Generation failed",
                              description: "Failed to generate content. Please try again.",
                              variant: "destructive",
                            });
                          });
                        } else if (opportunity.status === 'queued') {
                          // View in queue
                          toast({
                            title: "Content queued",
                            description: "This opportunity is already in your content queue.",
                          });
                        } else if (opportunity.status === 'completed') {
                          toast({
                            title: "Already processed",
                            description: "Content has already been generated for this opportunity.",
                          });
                        }
                      }}
                    >
                      {opportunity.status === 'new' ? 'Generate Content' : 
                       opportunity.status === 'queued' ? 'View in Queue' : 
                       opportunity.status === 'processing' ? 'Processing...' : 'View Content'}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center p-12 bg-gray-50 rounded-lg">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  We haven't discovered any content opportunities yet. Try adding keywords related to your products or starting a scan.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Show dialog to add keyword
                      const keyword = window.prompt("Enter keyword to track:");
                      if (keyword) {
                        fetch('/api/keywords', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            keyword: keyword,
                            status: 'active',
                            priority: 'medium',
                            campaignId: selectedCampaign ? parseInt(selectedCampaign) : null
                          })
                        })
                        .then(res => res.json())
                        .then(data => {
                          queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
                          toast({
                            title: "Keyword added",
                            description: `"${keyword}" has been added to your tracking list.`,
                          });
                        })
                        .catch(err => {
                          toast({
                            title: "Failed to add keyword",
                            description: "Could not add the keyword. Please try again.",
                            variant: "destructive",
                          });
                        });
                      }
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Keywords
                  </Button>
                  <Button
                    onClick={() => {
                      toast({
                        title: "Scanning for opportunities",
                        description: "Scanning Reddit for potential affiliate marketing opportunities...",
                      });
                      
                      // Call the API to trigger a scan
                      fetch('/api/opportunities/scan', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ keywordLimit: 10 })
                      })
                      .then(res => res.json())
                      .then(data => {
                        queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
                        queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
                        
                        toast({
                          title: "Scan completed",
                          description: `Processed ${data.processedKeywords} keywords and found ${data.queuedCount} new opportunities.`,
                        });
                      })
                      .catch(err => {
                        toast({
                          title: "Scan failed",
                          description: "Failed to scan for new opportunities. Please try again.",
                          variant: "destructive",
                        });
                      });
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Start Scan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templatesLoading ? (
              // Loading skeletons
              Array(6).fill(0).map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : contentTemplates?.length > 0 ? (
              // Template cards
              contentTemplates.map((template: any) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle>{template.title}</CardTitle>
                    <Badge variant="outline">{template.contentType}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-4">{template.template}</p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {template.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => {
                        setContentType(template.contentType);
                        setContent(template.template);
                        // If it's a post template with a title pattern, extract it
                        if (template.contentType === "post" && template.template.includes("[TITLE]")) {
                          const titleMatch = template.template.match(/\[TITLE\](.*?)(?:\[|$)/);
                          if (titleMatch && titleMatch[1]) {
                            setTitle(titleMatch[1].trim());
                          }
                        }
                      }}
                      className="w-full"
                    >
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              // No templates
              <div className="col-span-full text-center p-8">
                <h3 className="text-lg font-semibold">No templates found</h3>
                <p className="text-gray-500 mt-1">
                  Templates will help you quickly create content
                </p>
                <Button className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "posted":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Posted</Badge>;
    case "scheduled":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>;
    case "draft":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default ContentLibrary;
