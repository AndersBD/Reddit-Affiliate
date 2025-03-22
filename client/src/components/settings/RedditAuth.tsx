import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertCircle, CheckCircle2, ExternalLink, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AuthStatus {
  authenticated: boolean;
  username?: string;
  scope?: string;
  expiresAt?: string;
  error?: string;
}

export function RedditAuth() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Fetch Reddit auth status
  const { data: authStatus, isLoading: isAuthLoading, refetch } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/reddit/status"],
    queryFn: async () => {
      const res = await fetch("/api/auth/reddit/status");
      return res.json();
    }
  });

  // Mutation to disconnect Reddit account
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/auth/reddit/disconnect", "POST");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your Reddit account has been disconnected.",
        variant: "default",
      });
      // Refetch auth status
      queryClient.invalidateQueries({ queryKey: ["/api/auth/reddit/status"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to disconnect Reddit account: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleConnect = async () => {
    setLoading(true);
    try {
      // Get the authorization URL from our API
      const response = await fetch("/api/auth/reddit/authorize");
      const data = await response.json();
      
      if (data.authUrl) {
        // Open Reddit OAuth authorization page in a new window
        window.open(data.authUrl, "_blank", "width=800,height=700");
        
        // Set up a timer to check for auth status updates
        const checkAuthStatus = setInterval(() => {
          refetch().then((result) => {
            if (result.data?.authenticated) {
              clearInterval(checkAuthStatus);
              setLoading(false);
              toast({
                title: "Success",
                description: "Your Reddit account has been connected!",
                variant: "default",
              });
            }
          });
        }, 2000);

        // Stop checking after 2 minutes
        setTimeout(() => {
          clearInterval(checkAuthStatus);
          setLoading(false);
        }, 120000);
      } else {
        throw new Error("Failed to get authorization URL");
      }
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: `Failed to connect Reddit account: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  if (isAuthLoading) {
    return (
      <Card className="p-4 border border-gray-200">
        <div className="flex items-center justify-center py-6">
          <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin"></div>
        </div>
      </Card>
    );
  }

  if (authStatus?.authenticated) {
    return (
      <Card className="p-4 border border-gray-200">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="text-green-500 h-5 w-5 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium">Connected to Reddit</h4>
            <div className="text-sm text-muted-foreground space-y-1 mt-1">
              <p>Username: <span className="font-medium">{authStatus.username}</span></p>
              {authStatus.expiresAt && (
                <p>
                  Token expires: <span className="font-medium">{new Date(authStatus.expiresAt).toLocaleString()}</span>
                </p>
              )}
              {authStatus.scope && (
                <p>
                  Permissions: <span className="font-medium">{authStatus.scope.replaceAll(" ", ", ")}</span>
                </p>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3" 
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect Account"}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border border-gray-200">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-amber-500 h-5 w-5 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium">Not Connected to Reddit</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your Reddit account to automate posting and tracking on Reddit.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-current rounded-full animate-spin mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>Connect Reddit Account</>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open("https://www.reddit.com/prefs/apps", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Create Reddit App
            </Button>
          </div>
          {authStatus?.error && (
            <div className="mt-3 text-sm text-red-500">
              Error: {authStatus.error}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}