import { query } from '../db';

// Interface for Reddit token information
interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

// Reddit API constants
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || 'YOUR_CLIENT_ID';
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REDDIT_REDIRECT_URI = process.env.REDDIT_REDIRECT_URI || 'http://localhost:5000/api/auth/reddit/callback';
const REDDIT_USER_AGENT = process.env.REDDIT_USER_AGENT || 'node:com.yourapp.redditbot:v1.0.0 (by /u/yourusername)';

/**
 * Generates a Reddit authorization URL for user consent
 */
export function getAuthorizationUrl(state: string): string {
  const scopes = ['identity', 'submit', 'read'].join(' ');
  const url = new URL('https://www.reddit.com/api/v1/authorize');
  
  url.searchParams.append('client_id', REDDIT_CLIENT_ID);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('state', state);
  url.searchParams.append('redirect_uri', REDDIT_REDIRECT_URI);
  url.searchParams.append('duration', 'permanent');
  url.searchParams.append('scope', scopes);
  
  return url.toString();
}

/**
 * Exchanges an authorization code for an access token
 */
export async function exchangeCodeForToken(code: string): Promise<TokenInfo> {
  try {
    const basicAuth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('code', code);
    body.append('redirect_uri', REDDIT_REDIRECT_URI);
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': REDDIT_USER_AGENT
      },
      body: body.toString()
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const tokenInfo: TokenInfo = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope
    };
    
    // Store token in database for persistence
    await storeTokenInDatabase(tokenInfo);
    
    return tokenInfo;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
}

/**
 * Refreshes an access token using a refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenInfo> {
  try {
    const basicAuth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
    const body = new URLSearchParams();
    body.append('grant_type', 'refresh_token');
    body.append('refresh_token', refreshToken);
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': REDDIT_USER_AGENT
      },
      body: body.toString()
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const tokenInfo: TokenInfo = {
      accessToken: data.access_token,
      refreshToken: refreshToken,
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope
    };
    
    // Store token in database for persistence
    await storeTokenInDatabase(tokenInfo);
    
    return tokenInfo;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

/**
 * Get access token, refreshing if necessary
 */
export async function getAccessToken(): Promise<string> {
  try {
    const tokenInfo = await getTokenFromDatabase();
    
    if (!tokenInfo) {
      throw new Error('No token available. User must authenticate with Reddit.');
    }
    
    // Check if token is expired or about to expire (within 5 minutes)
    if (tokenInfo.expiresAt <= Date.now() + 300000) {
      // Token is expired or about to expire, refresh it
      const newTokenInfo = await refreshAccessToken(tokenInfo.refreshToken);
      return newTokenInfo.accessToken;
    }
    
    // Token is still valid
    return tokenInfo.accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

/**
 * Store token in database for persistence
 */
async function storeTokenInDatabase(tokenInfo: TokenInfo): Promise<void> {
  try {
    // For MVP, store only one token
    const insertQuery = `
      INSERT INTO reddit_auth (
        access_token, 
        refresh_token, 
        expires_at, 
        scope
      ) VALUES ($1, $2, to_timestamp($3/1000), $4)
      ON CONFLICT (id) DO UPDATE SET
        access_token = $1,
        refresh_token = $2,
        expires_at = to_timestamp($3/1000),
        scope = $4
        RETURNING *
    `;
    
    await query(insertQuery, [
      tokenInfo.accessToken,
      tokenInfo.refreshToken,
      tokenInfo.expiresAt,
      tokenInfo.scope
    ]);
  } catch (error) {
    console.error('Error storing token in database:', error);
    // For MVP, we can continue even if there's an error storing the token
  }
}

/**
 * Get token from database
 */
async function getTokenFromDatabase(): Promise<TokenInfo | null> {
  try {
    const result = await query('SELECT * FROM reddit_auth LIMIT 1');
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: new Date(row.expires_at).getTime(),
      scope: row.scope
    };
  } catch (error) {
    console.error('Error getting token from database:', error);
    return null;
  }
}

/**
 * Remove token from database
 */
async function removeTokenFromDatabase(): Promise<void> {
  try {
    await query('DELETE FROM reddit_auth');
  } catch (error) {
    console.error('Error removing token from database:', error);
  }
}

/**
 * Make an authenticated request to the Reddit API
 */
export async function redditApiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<any> {
  try {
    const accessToken = await getAccessToken();
    const isOauth = endpoint.startsWith('/api/');
    const baseUrl = isOauth ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
    const url = `${baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': REDDIT_USER_AGENT,
      'Content-Type': 'application/json'
    };
    
    const options: RequestInit = {
      method,
      headers,
      credentials: 'omit'
    };
    
    if (data) {
      if (method === 'GET') {
        // For GET requests, add data as query parameters
        const urlObj = new URL(url);
        Object.entries(data).forEach(([key, value]) => {
          urlObj.searchParams.append(key, String(value));
        });
        options.body = undefined;
      } else {
        // For POST, PUT, DELETE requests, add data as JSON body
        options.body = JSON.stringify(data);
      }
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Reddit API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error making Reddit API request to ${endpoint}:`, error.message);
    } else {
      console.error(`Unknown error making Reddit API request to ${endpoint}`);
    }
    throw error;
  }
}