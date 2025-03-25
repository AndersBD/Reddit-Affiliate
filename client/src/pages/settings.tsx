import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Link,
  Terminal,
  Shield,
  Bell,
  Key,
  User,
  CreditCard,
  KeyRound
} from "lucide-react";
import RedditAuth from "@/components/settings/RedditAuth";

// Schema for API settings
const apiSettingsSchema = z.object({
  redditClientId: z.string().min(1, "Reddit Client ID is required"),
  redditClientSecret: z.string().min(1, "Reddit Client Secret is required"),
  redditUsername: z.string().min(1, "Reddit Username is required"),
  redditPassword: z.string().min(1, "Reddit Password is required"),
  openaiApiKey: z.string().min(1, "OpenAI API Key is required"),
  apiRateLimit: z.coerce.number().min(10).max(1000),
});

// Schema for notification settings
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  campaignAlerts: z.boolean().default(true),
  schedulingReminders: z.boolean().default(true),
  performanceReports: z.boolean().default(true),
  emailAddress: z.string().email().optional(),
});

// Schema for account settings
const accountSettingsSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().optional(),
});

type ApiSettingsValues = z.infer<typeof apiSettingsSchema>;
type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;
type AccountSettingsValues = z.infer<typeof accountSettingsSchema>;

const Settings = () => {
  const [activeTab, setActiveTab] = useState("account");
  const { toast } = useToast();

  // API Settings form
  const apiSettingsForm = useForm<ApiSettingsValues>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: {
      redditClientId: "",
      redditClientSecret: "",
      redditUsername: "",
      redditPassword: "",
      openaiApiKey: "",
      apiRateLimit: 300,
    },
  });

  // Notification Settings form
  const notificationSettingsForm = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      campaignAlerts: true,
      schedulingReminders: true,
      performanceReports: true,
      emailAddress: "",
    },
  });

  // Account Settings form
  const accountSettingsForm = useForm<AccountSettingsValues>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
    },
  });

  // Mock fetch of settings - in a real app, these would come from the API
  const { data: apiSettings, isLoading: isLoadingApiSettings } = useQuery({
    queryKey: ['/api/settings/api'],
    onSuccess: (data) => {
      if (data) {
        apiSettingsForm.reset({
          redditClientId: data.redditClientId || "",
          redditClientSecret: data.redditClientSecret || "",
          redditUsername: data.redditUsername || "",
          redditPassword: data.redditPassword || "",
          openaiApiKey: data.openaiApiKey || "",
          apiRateLimit: data.apiRateLimit || 300,
        });
      }
    },
  });

  const { data: notificationSettings, isLoading: isLoadingNotificationSettings } = useQuery({
    queryKey: ['/api/settings/notifications'],
    onSuccess: (data) => {
      if (data) {
        notificationSettingsForm.reset({
          emailNotifications: data.emailNotifications,
          campaignAlerts: data.campaignAlerts,
          schedulingReminders: data.schedulingReminders,
          performanceReports: data.performanceReports,
          emailAddress: data.emailAddress || "",
        });
      }
    },
  });

  const { data: accountSettings, isLoading: isLoadingAccountSettings } = useQuery({
    queryKey: ['/api/settings/account'],
    onSuccess: (data) => {
      if (data) {
        accountSettingsForm.reset({
          username: data.username || "",
          email: data.email || "",
          fullName: data.fullName || "",
        });
      }
    },
  });

  // Mock save mutations - in a real app, these would save to the API
  const apiSettingsMutation = useMutation({
    mutationFn: (data: ApiSettingsValues) => {
      // This would be an actual API call in a real app
      return new Promise<void>((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "API Settings Saved",
        description: "Your API settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "There was an error saving your API settings.",
        variant: "destructive",
      });
    },
  });

  const notificationSettingsMutation = useMutation({
    mutationFn: (data: NotificationSettingsValues) => {
      // This would be an actual API call in a real app
      return new Promise<void>((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Notification Settings Saved",
        description: "Your notification settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "There was an error saving your notification settings.",
        variant: "destructive",
      });
    },
  });

  const accountSettingsMutation = useMutation({
    mutationFn: (data: AccountSettingsValues) => {
      // This would be an actual API call in a real app
      return new Promise<void>((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Account Settings Saved",
        description: "Your account settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "There was an error saving your account settings.",
        variant: "destructive",
      });
    },
  });

  // Form handlers
  const onApiSettingsSubmit = (data: ApiSettingsValues) => {
    apiSettingsMutation.mutate(data);
  };

  const onNotificationSettingsSubmit = (data: NotificationSettingsValues) => {
    notificationSettingsMutation.mutate(data);
  };

  const onAccountSettingsSubmit = (data: AccountSettingsValues) => {
    accountSettingsMutation.mutate(data);
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-primary-800">Settings</h1>
        <p className="text-gray-600">Manage your account, API credentials, and preferences</p>
      </div>

      <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full mb-6">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API Settings</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Update your account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAccountSettings ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <Form {...accountSettingsForm}>
                  <form onSubmit={accountSettingsForm.handleSubmit(onAccountSettingsSubmit)} className="space-y-4">
                    <FormField
                      control={accountSettingsForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
                          </FormControl>
                          <FormDescription>
                            This is your public display name.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={accountSettingsForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="example@email.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            We'll use this email for important notifications.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={accountSettingsForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <h3 className="text-lg font-medium mb-2">Security</h3>
                      <div className="space-y-4">
                        <div>
                          <Label>Change Password</Label>
                          <div className="mt-2">
                            <Button variant="outline">
                              <KeyRound className="h-4 w-4 mr-2" />
                              Change Password
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Two-Factor Authentication</Label>
                          <div className="flex items-center mt-2">
                            <Switch id="2fa" />
                            <Label htmlFor="2fa" className="ml-2">Enable two-factor authentication</Label>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Add an extra layer of security to your account.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div>
                      <h3 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <Button variant="destructive">
                        Delete Account
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                type="submit" 
                onClick={accountSettingsForm.handleSubmit(onAccountSettingsSubmit)}
                disabled={accountSettingsMutation.isPending || !accountSettingsForm.formState.isDirty}
              >
                {accountSettingsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>
                Manage your API keys and connection settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingApiSettings ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <Form {...apiSettingsForm}>
                  <form onSubmit={apiSettingsForm.handleSubmit(onApiSettingsSubmit)} className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 mb-4">
                      <div className="flex items-start">
                        <Shield className="h-5 w-5 mr-2 mt-0.5" />
                        <div>
                          <h4 className="font-medium">API Credentials Security</h4>
                          <p className="text-sm">
                            Your API credentials are sensitive. Never share them with anyone or commit them to public repositories.
                          </p>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium">Reddit API Integration</h3>
                    <div className="mb-6">
                      <RedditAuth />
                    </div>
                    
                    <h3 className="text-lg font-medium mt-8">Legacy Reddit API Credentials</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      These are only needed if you're not using OAuth authentication above.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={apiSettingsForm.control}
                        name="redditClientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reddit Client ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter Reddit Client ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={apiSettingsForm.control}
                        name="redditClientSecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reddit Client Secret</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter Reddit Client Secret" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={apiSettingsForm.control}
                        name="redditUsername"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reddit Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter Reddit Username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={apiSettingsForm.control}
                        name="redditPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reddit Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter Reddit Password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-4">
                      <h3 className="text-lg font-medium">OpenAI API Settings</h3>
                      <FormField
                        control={apiSettingsForm.control}
                        name="openaiApiKey"
                        render={({ field }) => (
                          <FormItem className="mt-2">
                            <FormLabel>OpenAI API Key</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter OpenAI API Key" {...field} />
                            </FormControl>
                            <FormDescription>
                              Used for AI content generation. Get this from the OpenAI dashboard.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-4">
                      <h3 className="text-lg font-medium">Rate Limiting</h3>
                      <FormField
                        control={apiSettingsForm.control}
                        name="apiRateLimit"
                        render={({ field }) => (
                          <FormItem className="mt-2">
                            <FormLabel>API Requests per Hour</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={10} 
                                max={1000} 
                                placeholder="300" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Reddit API free tier allows up to 1000 requests per hour, but we recommend staying below 300 to avoid issues.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-primary-50 border border-primary-200 text-primary-800 rounded-md p-4 mt-4">
                      <div className="flex items-start">
                        <Terminal className="h-5 w-5 mr-2 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Reddit API Documentation</h4>
                          <p className="text-sm">
                            Need help setting up your Reddit API credentials? 
                            <a 
                              href="https://www.reddit.com/dev/api/" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 ml-1"
                            >
                              Visit the Reddit API documentation
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                type="submit" 
                onClick={apiSettingsForm.handleSubmit(onApiSettingsSubmit)}
                disabled={apiSettingsMutation.isPending || !apiSettingsForm.formState.isDirty}
              >
                {apiSettingsMutation.isPending ? "Saving..." : "Save API Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingNotificationSettings ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <Form {...notificationSettingsForm}>
                  <form onSubmit={notificationSettingsForm.handleSubmit(onNotificationSettingsSubmit)} className="space-y-4">
                    <FormField
                      control={notificationSettingsForm.control}
                      name="emailAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notification Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Where we'll send email notifications. Leave blank to use your account email.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4 mt-6">
                      <h3 className="text-lg font-medium">Email Notification Preferences</h3>
                      
                      <FormField
                        control={notificationSettingsForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Email Notifications</FormLabel>
                              <FormDescription>
                                Receive any notifications via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationSettingsForm.control}
                        name="campaignAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Campaign Alerts</FormLabel>
                              <FormDescription>
                                Get notified about important campaign events
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!notificationSettingsForm.watch("emailNotifications")}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationSettingsForm.control}
                        name="schedulingReminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Scheduling Reminders</FormLabel>
                              <FormDescription>
                                Receive reminders about upcoming scheduled posts
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!notificationSettingsForm.watch("emailNotifications")}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationSettingsForm.control}
                        name="performanceReports"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Performance Reports</FormLabel>
                              <FormDescription>
                                Receive weekly performance reports for your campaigns
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!notificationSettingsForm.watch("emailNotifications")}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                type="submit" 
                onClick={notificationSettingsForm.handleSubmit(onNotificationSettingsSubmit)}
                disabled={notificationSettingsMutation.isPending || !notificationSettingsForm.formState.isDirty}
              >
                {notificationSettingsMutation.isPending ? "Saving..." : "Save Notifications Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-primary-800">Current Plan: Pro Plan</h3>
                  <p className="text-sm text-gray-600 mt-1">$29.99 / month</p>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Up to 10 active campaigns
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      500 AI content generations per month
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Advanced analytics
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Premium support
                    </li>
                  </ul>
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline">Change Plan</Button>
                    <Button variant="destructive">Cancel Subscription</Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Usage This Month</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border rounded-lg p-4">
                      <div className="text-sm text-gray-500">Active Campaigns</div>
                      <div className="mt-1 flex items-end">
                        <div className="text-2xl font-bold">7</div>
                        <div className="text-sm text-gray-500 ml-1">/ 10</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <div className="text-sm text-gray-500">AI Generations</div>
                      <div className="mt-1 flex items-end">
                        <div className="text-2xl font-bold">312</div>
                        <div className="text-sm text-gray-500 ml-1">/ 500</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '62%' }}></div>
                      </div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <div className="text-sm text-gray-500">API Requests</div>
                      <div className="mt-1 flex items-end">
                        <div className="text-2xl font-bold">1,245</div>
                        <div className="text-sm text-gray-500 ml-1">/ 5,000</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Payment Method</h3>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-gray-100 p-2 rounded-md mr-3">
                          <CreditCard className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">Visa ending in 4242</div>
                          <div className="text-sm text-gray-500">Expires 12/2025</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Update</Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Billing History</h3>
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">May 01, 2023</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Pro Plan - Monthly</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$29.99</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href="#" className="text-primary-600 hover:text-primary-800">View</a>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Apr 01, 2023</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Pro Plan - Monthly</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$29.99</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href="#" className="text-primary-600 hover:text-primary-800">View</a>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Mar 01, 2023</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Pro Plan - Monthly</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$29.99</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href="#" className="text-primary-600 hover:text-primary-800">View</a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Settings;
