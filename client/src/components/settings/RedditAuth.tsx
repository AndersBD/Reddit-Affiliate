import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AuthStatus {
  authenticated: boolean;
  username?: string;
  scope?: string;
  expiresAt?: string;
  error?: string;
}

export function RedditAuth() {
  const queryClient = useQueryClient();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Query to fetch Reddit auth status
  const { data: authStatus, isLoading, error } = useQuery<AuthStatus>({
    queryKey: ['/api/auth/status'],
    queryFn: () => apiRequest('/api/auth/status'),
    refetchInterval: 60000, // Refresh every minute
  });

  // Mutation to disconnect Reddit account
  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('/api/auth/disconnect', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
    },
  });

  // Handle connect button click
  const handleConnect = () => {
    setIsRedirecting(true);
    window.location.href = '/api/auth/reddit';
  };

  // Handle disconnect button click
  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  // Calculate remaining time
  const getTimeRemaining = (expiresAt?: string): string => {
    if (!expiresAt) return 'Unknown';
    
    const expiry = new Date(expiresAt).getTime();
    const now = Date.now();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes % 60} minute${(minutes % 60) !== 1 ? 's' : ''}`;
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <img 
            src="https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png" 
            alt="Reddit Logo" 
            className="w-6 h-6 mr-2" 
          />
          Reddit Integration
        </CardTitle>
        <CardDescription>
          Connect your Reddit account to enable posting and scheduling content
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center my-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Checking connection status...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to check Reddit connection status. Please try again.
            </AlertDescription>
          </Alert>
        ) : authStatus?.authenticated ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">Connected Account</p>
                <p className="text-sm text-muted-foreground">{authStatus.username}</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session expires in:</span>
                <span>{getTimeRemaining(authStatus.expiresAt)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Permissions:</span>
                <span>{authStatus.scope || 'Basic access'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <Alert variant="default" className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not Connected</AlertTitle>
              <AlertDescription>
                You need to connect your Reddit account to enable posting features.
              </AlertDescription>
            </Alert>
            
            <p className="text-sm text-muted-foreground mb-2">
              Connecting will allow this app to:
            </p>
            <ul className="text-sm list-disc pl-5 space-y-1 mb-4">
              <li>Post content to subreddits on your behalf</li>
              <li>Read public subreddit information</li>
              <li>Access your Reddit username</li>
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2">
        {authStatus?.authenticated ? (
          <>
            <Button 
              variant="outline" 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] })}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDisconnect} 
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Disconnect
            </Button>
          </>
        ) : (
          <Button onClick={handleConnect} disabled={isRedirecting}>
            {isRedirecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Redirecting...
              </>
            ) : (
              'Connect Reddit Account'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default RedditAuth;