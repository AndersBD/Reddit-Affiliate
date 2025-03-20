import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useRoute } from "wouter";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createCampaign, updateCampaign } from "@/lib/api";

// Schema for campaign validation
const campaignSchema = z.object({
  name: z.string().min(3, { message: "Campaign name must be at least 3 characters" }),
  affiliateProgramId: z.string().min(1, { message: "Please select an affiliate program" }),
  description: z.string().optional(),
  targetSubreddits: z.array(z.string()).min(1, { message: "Add at least one subreddit" }),
  status: z.string().default("draft"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().min(0).optional(),
  schedule: z.object({
    frequency: z.string(),
    daysOfWeek: z.array(z.number()).optional(),
    timeRanges: z.array(z.string()),
    timezone: z.string().default("America/New_York"),
  }).optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignFormProps {
  campaignId?: string;
}

const CampaignForm = ({ campaignId }: CampaignFormProps) => {
  const [subredditInput, setSubredditInput] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Fetch data
  const { data: affiliatePrograms, isLoading: programsLoading } = useQuery({
    queryKey: ['/api/affiliate-programs'],
  });

  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['/api/campaigns', campaignId],
    enabled: !!campaignId,
  });

  const { data: subreddits } = useQuery({
    queryKey: ['/api/subreddits'],
  });

  // Set up form
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      affiliateProgramId: "",
      description: "",
      targetSubreddits: [],
      status: "draft",
      budget: 100,
      schedule: {
        frequency: "daily",
        daysOfWeek: [],
        timeRanges: ["14:00-16:00"],
        timezone: "America/New_York",
      },
    },
  });

  // Fill form with campaign data when editing
  useEffect(() => {
    if (campaign && !campaignLoading) {
      form.reset({
        name: campaign.name,
        affiliateProgramId: campaign.affiliateProgramId.toString(),
        description: campaign.description || "",
        targetSubreddits: campaign.targetSubreddits || [],
        status: campaign.status,
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : undefined,
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : undefined,
        budget: campaign.budget,
        schedule: campaign.schedule,
      });
      
      if (campaign.schedule?.daysOfWeek) {
        setSelectedDays(campaign.schedule.daysOfWeek);
      }
    }
  }, [campaign, campaignLoading, form]);

  // Mutations
  const createCampaignMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campaign Created",
        description: "Your campaign has been successfully created.",
      });
      navigate("/campaigns");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error creating your campaign.",
        variant: "destructive",
      });
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campaign Updated",
        description: "Your campaign has been successfully updated.",
      });
      navigate("/campaigns");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error updating your campaign.",
        variant: "destructive",
      });
    }
  });

  // Form submission
  const onSubmit = (data: CampaignFormData) => {
    // Format dates
    const formattedData = {
      ...data,
      affiliateProgramId: parseInt(data.affiliateProgramId),
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      schedule: {
        ...data.schedule,
        daysOfWeek: selectedDays.length > 0 ? selectedDays : undefined,
      },
    };
    
    if (campaignId) {
      updateCampaignMutation.mutate({ id: parseInt(campaignId), data: formattedData });
    } else {
      createCampaignMutation.mutate(formattedData);
    }
  };

  // Add subreddit to the list
  const addSubreddit = () => {
    if (!subredditInput) return;
    
    // Format subreddit name (ensure it starts with r/)
    let formattedName = subredditInput.trim();
    if (!formattedName.startsWith('r/')) {
      formattedName = `r/${formattedName}`;
    }
    
    // Add to form if not already in list
    const currentSubreddits = form.getValues("targetSubreddits") || [];
    if (!currentSubreddits.includes(formattedName)) {
      form.setValue("targetSubreddits", [...currentSubreddits, formattedName]);
    }
    
    setSubredditInput("");
  };

  // Remove subreddit from the list
  const removeSubreddit = (name: string) => {
    const currentSubreddits = form.getValues("targetSubreddits") || [];
    form.setValue(
      "targetSubreddits", 
      currentSubreddits.filter(s => s !== name)
    );
  };

  // Toggle day selection
  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    );
  };

  // Day names for display
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Loading state
  const isLoading = programsLoading || (campaignId && campaignLoading);
  const isSubmitting = createCampaignMutation.isPending || updateCampaignMutation.isPending;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {campaignId ? "Edit Campaign" : "Create New Campaign"}
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-32 w-full rounded-md" />
              </div>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter campaign name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="affiliateProgramId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affiliate Program</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an affiliate program" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {affiliatePrograms?.map((program: any) => (
                            <SelectItem key={program.id} value={program.id.toString()}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe your campaign" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="targetSubreddits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Subreddits</FormLabel>
                      <div className="flex flex-wrap items-center border border-gray-300 rounded-md p-2 min-h-10">
                        {field.value?.map((subreddit) => (
                          <Badge key={subreddit} className="m-1 flex items-center bg-primary-100 text-primary-800 hover:bg-primary-100">
                            {subreddit}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-4 w-4 p-0 ml-1 text-primary-600 hover:text-primary-800"
                              onClick={() => removeSubreddit(subreddit)}
                              type="button"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                        <div className="flex-1 min-w-[120px]">
                          <Input 
                            type="text" 
                            className="border-0 p-1 focus:ring-0 text-sm" 
                            placeholder="Add subreddit..."
                            value={subredditInput}
                            onChange={(e) => setSubredditInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addSubreddit();
                              }
                            }}
                            list="subreddit-options"
                          />
                          <datalist id="subreddit-options">
                            {subreddits?.map((subreddit: any) => (
                              <option key={subreddit.id} value={subreddit.name} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Budget ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="schedule.frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posting Schedule</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {(form.watch("schedule.frequency") === "weekly" || form.watch("schedule.frequency") === "custom") && (
                  <FormItem>
                    <FormLabel>Days of Week</FormLabel>
                    <div className="grid grid-cols-7 gap-2">
                      {dayNames.map((day, index) => (
                        <Button
                          key={day}
                          type="button"
                          variant={selectedDays.includes(index) ? "default" : "outline"}
                          onClick={() => toggleDay(index)}
                          className="p-2 text-sm"
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Status</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/campaigns")}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting 
                ? "Saving..." 
                : campaignId 
                  ? "Update Campaign" 
                  : "Create Campaign"
              }
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default CampaignForm;
