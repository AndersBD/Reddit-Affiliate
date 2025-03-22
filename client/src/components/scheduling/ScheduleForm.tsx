import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CalendarDays, Clock, ArrowLeft, Save } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { schedulePost, cancelScheduledPost } from "@/lib/api";

// Schema for schedule validation
const scheduleSchema = z.object({
  date: z.date(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Enter a valid time in 24-hour format (HH:MM)"),
  timezone: z.string().default("America/New_York"),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface ScheduleFormProps {
  postId?: string;
}

const ScheduleForm = ({ postId }: ScheduleFormProps) => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch post data if editing
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['/api/reddit-posts', postId],
    enabled: !!postId,
  });

  // Get timezone options
  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
    "Pacific/Auckland"
  ];

  // Set up form with default values
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      date: new Date(),
      time: format(new Date(), "HH:mm"),
      timezone: "America/New_York"
    },
  });

  // Update form values when post data is loaded
  useEffect(() => {
    if (post && !postLoading && post.scheduledTime) {
      const scheduledDate = new Date(post.scheduledTime);
      form.reset({
        date: scheduledDate,
        time: format(scheduledDate, "HH:mm"),
        timezone: "America/New_York" // Default timezone as it's not stored in the API
      });
    }
  }, [post, postLoading, form]);

  // Schedule post mutation
  const scheduleMutation = useMutation({
    mutationFn: (data: { id: string, scheduledTime: string }) => 
      schedulePost(parseInt(data.id), new Date(data.scheduledTime)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reddit-posts'] });
      toast({
        title: "Post Scheduled",
        description: "Your post has been scheduled successfully.",
      });
      navigate("/scheduling");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error scheduling your post.",
        variant: "destructive",
      });
    }
  });

  // Cancel schedule mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelScheduledPost(parseInt(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reddit-posts'] });
      toast({
        title: "Schedule Cancelled",
        description: "Your post has been unscheduled.",
      });
      navigate("/scheduling");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error cancelling the schedule.",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: ScheduleFormValues) => {
    if (!postId) {
      toast({
        title: "Error",
        description: "No post selected for scheduling.",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time
    const [hours, minutes] = data.time.split(':').map(Number);
    const scheduledDate = new Date(data.date);
    scheduledDate.setHours(hours, minutes, 0, 0);

    // Schedule the post
    scheduleMutation.mutate({
      id: postId,
      scheduledTime: scheduledDate.toISOString()
    });
  };

  // Handle cancel schedule
  const handleCancelSchedule = () => {
    if (!postId) return;
    cancelMutation.mutate(postId);
  };

  // Loading state
  const isLoading = postLoading || scheduleMutation.isPending || cancelMutation.isPending;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/scheduling")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle>
            {postId ? "Edit Schedule" : "Schedule New Post"}
          </CardTitle>
        </div>
      </CardHeader>
      
      {postLoading ? (
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      ) : (
        <>
          <CardContent className="space-y-6">
            {post && (
              <div>
                <h3 className="font-medium mb-1">Post Details</h3>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{post.title || "Comment"}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge>{post.subredditName}</Badge>
                          <Badge variant="outline">{post.postType}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Campaign ID: {post.campaignId}</p>
                        {post.status === "scheduled" && post.scheduledTime && (
                          <p className="text-sm font-medium mt-1">
                            Currently scheduled for {format(new Date(post.scheduledTime), "PPP p")}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm mt-3 line-clamp-2 text-gray-600">{post.content}</p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Schedule Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule Time (24h)</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="HH:MM"
                              className="pl-9"
                            />
                          </FormControl>
                          <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timezones.map((timezone) => (
                              <SelectItem key={timezone} value={timezone || "default-timezone"}>
                                {timezone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="pt-4">
                  <h3 className="font-medium mb-2">Posting Recommendations</h3>
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm">
                    <p className="text-blue-800 font-medium">Best times to post for engagement:</p>
                    <ul className="mt-1 text-blue-700 space-y-1">
                      <li>• Weekdays: 8am-10am or 12pm-2pm (Eastern Time)</li>
                      <li>• Weekends: 10am-12pm (Eastern Time)</li>
                      <li>• Avoid posting during major holidays or late night hours</li>
                    </ul>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <div>
              {post?.status === "scheduled" && (
                <Button 
                  variant="outline" 
                  onClick={handleCancelSchedule}
                  disabled={isLoading}
                >
                  Cancel Schedule
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => navigate("/scheduling")}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={isLoading}
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Schedule Post"}
              </Button>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default ScheduleForm;
