import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, ExternalLink, Info, Loader2 } from 'lucide-react';
import { 
  getRedditAuthStatus, 
  disconnectRedditAccount, 
  saveRedditCredentials,
  checkRedditCredentials
} from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const RedditAuth = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current Reddit auth status
  const { data: authStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/auth/reddit/status'],
    queryFn: getRedditAuthStatus
  });
  
  // Check if Reddit credentials are configured
  const { data: credentialsData, isLoading: credentialsLoading } = useQuery({
    queryKey: ['/api/auth/reddit/credentials'],
    queryFn: checkRedditCredentials
  });

  // Set default redirect URI based on current URL
  useEffect(() => {
    if (!redirectUri) {
      const baseUrl = window.location.origin;
      setRedirectUri(`${baseUrl}/api/auth/reddit/callback`);
    }
  }, [redirectUri]);

  // Disconnect Reddit account
  const disconnectMutation = useMutation({
    mutationFn: disconnectRedditAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/reddit/status'] });
      toast({
        title: "Reddit account disconnected",
        description: "Your Reddit account has been disconnected successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Disconnection failed",
        description: "Could not disconnect your Reddit account. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Save Reddit API credentials
  const saveCredentialsMutation = useMutation({
    mutationFn: (credentials: { clientId: string; clientSecret: string; redirectUri: string; }) => {
      return saveRedditCredentials(credentials);
    },
    onSuccess: () => {
      toast({
        title: "Credentials saved",
        description: "Reddit API credentials have been saved successfully.",
      });
      // Refresh both queries
      queryClient.invalidateQueries({ queryKey: ['/api/auth/reddit/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/reddit/credentials'] });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: "Could not save Reddit API credentials. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle save credentials
  const handleSaveCredentials = () => {
    if (!clientId || !clientSecret || !redirectUri) {
      toast({
        title: "Missing information",
        description: "Please provide all required API credentials.",
        variant: "destructive",
      });
      return;
    }

    saveCredentialsMutation.mutate({ clientId, clientSecret, redirectUri });
  };

  // Start authorization flow
  const handleAuthorize = async () => {
    try {
      const response = await fetch('/api/auth/reddit/authorize');
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Authorization failed",
        description: "Could not start the Reddit OAuth flow. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2 text-orange-500" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
          </svg>
          Reddit Authentication
        </CardTitle>
        <CardDescription>
          Configure Reddit API credentials for real-time opportunity fetching and content posting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : authStatus?.authenticated ? (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle>Connected to Reddit</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Your account is authenticated as <strong>{authStatus.username}</strong>.</p>
              <p className="text-sm text-gray-600">Token expires: {new Date(authStatus.expiresAt).toLocaleString()}</p>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertTitle>Reddit Authentication Required</AlertTitle>
              <AlertDescription>
                To fetch real-time opportunities and post content on Reddit, you need to set up API credentials.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input 
                id="clientId" 
                value={clientId} 
                onChange={(e) => setClientId(e.target.value)} 
                placeholder="Your Reddit app client ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input 
                id="clientSecret" 
                type="password" 
                value={clientSecret} 
                onChange={(e) => setClientSecret(e.target.value)} 
                placeholder="Your Reddit app client secret"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="redirectUri">Redirect URI</Label>
              <Input 
                id="redirectUri" 
                value={redirectUri} 
                onChange={(e) => setRedirectUri(e.target.value)} 
                placeholder="Callback URL (must match your Reddit app settings)"
              />
              <p className="text-xs text-gray-500 mt-1">
                This must match exactly with the redirect URI configured in your Reddit app.
              </p>
            </div>
            
            <div className="text-sm text-gray-600 pt-2">
              <h4 className="font-medium mb-1">How to get Reddit API credentials:</h4>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Go to <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center">
                  Reddit App Preferences <ExternalLink className="h-3 w-3 ml-1" />
                </a></li>
                <li>Click "create app" or "create another app" button</li>
                <li>Fill in name, select "web app" type</li>
                <li>Use this URL for the redirect URI: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{redirectUri}</code></li>
                <li>Create app and copy the Client ID and Secret</li>
              </ol>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {authStatus?.authenticated ? (
          <Button 
            variant="outline" 
            onClick={handleDisconnect} 
            disabled={disconnectMutation.isPending}
          >
            {disconnectMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              "Disconnect Reddit Account"
            )}
          </Button>
        ) : (
          <>
            <Button 
              variant="outline" 
              className="mr-2" 
              onClick={handleSaveCredentials} 
              disabled={isSaving || !clientId || !clientSecret || !redirectUri}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Credentials"
              )}
            </Button>
            <Button 
              onClick={handleAuthorize} 
              disabled={!authStatus?.hasCredentials}
            >
              Authorize with Reddit
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default RedditAuth;