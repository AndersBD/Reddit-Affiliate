/**
 * Reddit OAuth Authentication Service
 */

// Reddit OAuth Configuration - Replace with your actual credentials
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || '';
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || '';
const REDDIT_REDIRECT_URI = process.env.REDDIT_REDIRECT_URI || 'http://localhost:5000/api/auth/reddit/callback';
const REDDIT_OAUTH_URL = 'https://www.reddit.com/api/v1/authorize';
const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';

// Required permissions scope
const REDDIT_SCOPE = 'identity read submit';

interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

/**
 * Generates a Reddit authorization URL for user consent
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: REDDIT_CLIENT_ID,
    response_type: 'code',
    state,
    redirect_uri: REDDIT_REDIRECT_URI,
    duration: 'permanent',
    scope: REDDIT_SCOPE
  });

  return `${REDDIT_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchanges an authorization code for an access token
 */
export async function exchangeCodeForToken(code: string): Promise<TokenInfo> {
  // Reddit requires Basic Auth for this endpoint using client_id:client_secret
  const authString = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(REDDIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDDIT_REDIRECT_URI
    }).toString()
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Token exchange failed: ${errorData.error || response.statusText}`);
  }

  const data = await response.json();
  
  // Calculate when the token will expire
  const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

  const tokenInfo: TokenInfo = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    scope: data.scope
  };

  return tokenInfo;
}

/**
 * Refreshes an access token using a refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenInfo> {
  const authString = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(REDDIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }).toString()
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Token refresh failed: ${errorData.error || response.statusText}`);
  }

  const data = await response.json();
  
  // Calculate when the token will expire
  const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

  const tokenInfo: TokenInfo = {
    accessToken: data.access_token,
    refreshToken: refreshToken, // Use the same refresh token
    expiresAt,
    scope: data.scope
  };

  return tokenInfo;
}

/**
 * Get access token, refreshing if necessary
 */
export async function getAccessToken(): Promise<string> {
  // This is just a placeholder. In a real implementation, you'd retrieve the token from your database or session
  // and check if it's expired. If it is, you'd refresh it.
  // For now, we'll assume we have a valid token from the session.
  throw new Error('Not implemented - token should be retrieved from session');
}

/**
 * Make an authenticated request to the Reddit API
 */
export async function redditApiRequest(
  endpoint: string,
  accessToken: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
): Promise<any> {
  const headers: HeadersInit = {
    'Authorization': `Bearer ${accessToken}`,
    'User-Agent': 'AffiliateMarketingAutomation/1.0'
  };

  const options: RequestInit = {
    method,
    headers
  };

  if (body && method === 'POST') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`https://oauth.reddit.com${endpoint}`, options);

  if (!response.ok) {
    let errorText: string;
    try {
      const errorData = await response.json();
      errorText = errorData.error || errorData.message || response.statusText;
    } catch (e) {
      errorText = response.statusText;
    }
    throw new Error(`Reddit API request failed: ${errorText}`);
  }

  return response.json();
}