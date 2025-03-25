import { REDDIT_CONFIG, getRedditConfig } from '../config';

interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

// In-memory storage for tokens (would be replaced with database storage in production)
let currentToken: TokenInfo | null = null;

/**
 * Determines if all required Reddit credentials are available
 */
export function hasRedditCredentials(): boolean {
  const config = getRedditConfig();
  return !!(config.clientId && config.clientSecret && config.redirectUri);
}

/**
 * Generates a Reddit authorization URL for user consent
 */
export function getAuthorizationUrl(state: string): string {
  // Get fresh config in case credentials were updated
  const config = getRedditConfig();
  const { clientId, redirectUri } = config;
  
  if (!clientId || !redirectUri) {
    throw new Error("Missing Reddit API credentials");
  }
  
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('response_type', 'code');
  params.append('state', state);
  params.append('redirect_uri', redirectUri);
  params.append('duration', 'permanent');
  params.append('scope', 'read submit identity');
  
  return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
}

/**
 * Exchanges an authorization code for an access token
 */
export async function exchangeCodeForToken(code: string): Promise<TokenInfo> {
  // Get fresh config in case credentials were updated
  const config = getRedditConfig();
  const { clientId, clientSecret, redirectUri } = config;
  
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Reddit API credentials");
  }
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirectUri);
  
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': REDDIT_CONFIG.userAgent
    },
    body: params.toString()
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }
  
  const data = await response.json();
  
  const tokenInfo: TokenInfo = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
    scope: data.scope
  };
  
  // Store the token
  currentToken = tokenInfo;
  
  return tokenInfo;
}

/**
 * Refreshes an access token using a refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenInfo> {
  // Get fresh config in case credentials were updated
  const config = getRedditConfig();
  const { clientId, clientSecret } = config;
  
  if (!clientId || !clientSecret) {
    throw new Error("Missing Reddit API credentials");
  }
  
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': config.userAgent
    },
    body: params.toString()
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }
  
  const data = await response.json();
  
  const tokenInfo: TokenInfo = {
    accessToken: data.access_token,
    refreshToken: refreshToken, // Keep the same refresh token
    expiresAt: Date.now() + (data.expires_in * 1000),
    scope: data.scope
  };
  
  // Update the stored token
  currentToken = tokenInfo;
  
  return tokenInfo;
}

/**
 * Get access token, refreshing if necessary
 */
export async function getAccessToken(): Promise<string> {
  // If we don't have a token or refresh token, use application-only auth
  if (!currentToken || !currentToken.refreshToken) {
    // Get fresh config in case credentials were updated
    const config = getRedditConfig();
    const { clientId, clientSecret } = config;
    
    // Check if we have the necessary credentials
    if (!clientId || !clientSecret) {
      console.error("Missing Reddit API credentials for application-only auth");
      return '';
    }
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    try {
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': config.userAgent
        },
        body: params.toString()
      });
      
      if (!response.ok) {
        console.error(`Failed to get application-only token: ${response.status} ${response.statusText}`);
        return '';
      }
      
      const data = await response.json();
      
      return data.access_token;
    } catch (error) {
      console.error('Error getting application-only token:', error);
      return '';
    }
  }
  
  // Check if token needs refreshing
  if (Date.now() >= currentToken.expiresAt - 60000) { // Refresh if less than 1 minute remaining
    try {
      const refreshedToken = await refreshAccessToken(currentToken.refreshToken);
      return refreshedToken.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return '';
    }
  }
  
  // Return existing token
  return currentToken.accessToken;
}

/**
 * Make an authenticated request to the Reddit API
 */
export async function redditApiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<any> {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    throw new Error('Failed to get Reddit access token');
  }
  
  // Get fresh config in case credentials were updated
  const config = getRedditConfig();
  
  const headers: HeadersInit = {
    'Authorization': `Bearer ${accessToken}`,
    'User-Agent': config.userAgent,
    'Content-Type': 'application/json'
  };
  
  const options: RequestInit = {
    method,
    headers
  };
  
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`https://oauth.reddit.com${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Reddit API error (${response.status}): ${errorText}`);
  }
  
  return response.json();
}