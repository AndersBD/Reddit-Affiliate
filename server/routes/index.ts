import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import * as redditAuth from '../services/redditAuth';

const router = express.Router();

// Extend express-session declarations with our custom session properties
declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
    redditToken?: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      scope: string;
    };
    redditUsername?: string;
  }
}

/**
 * Route to initiate the OAuth flow by redirecting to Reddit's authorization page
 */
router.get("/api/auth/reddit/authorize", (req: Request, res: Response) => {
  try {
    // Generate a random state string to prevent CSRF attacks
    const state = randomBytes(16).toString('hex');
    
    // Store state in session to verify in the callback
    req.session.oauthState = state;
    
    // Generate authorization URL
    const url = redditAuth.getAuthorizationUrl(state);
    
    // Return the authorization URL
    res.json({ url });
  } catch (error) {
    console.error("Error generating authorization URL:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `Error initiating authorization: ${errorMessage}` });
  }
});

/**
 * Route to handle OAuth callback from Reddit
 */
router.get("/api/auth/reddit/callback", async (req: Request, res: Response) => {
  try {
    // Extract code and state from query parameters
    const { code, state, error } = req.query;
    
    // Check if there's an error in the query parameters
    if (error) {
      return res.status(400).json({ error: `Reddit authorization error: ${error}` });
    }
    
    // Validate required parameters
    if (!code || !state) {
      return res.status(400).json({ error: "Missing required parameters (code or state)" });
    }
    
    // Verify state to prevent CSRF attacks
    if (state !== req.session.oauthState) {
      return res.status(403).json({ error: "Invalid state parameter - possible CSRF attack" });
    }
    
    // Clear the state from session as it's no longer needed
    delete req.session.oauthState;
    
    // Exchange code for token
    const tokenInfo = await redditAuth.exchangeCodeForToken(code as string);
    
    // Store token in session
    req.session.redditToken = tokenInfo;
    
    // Fetch user information to get username
    const userInfo = await redditAuth.redditApiRequest('/api/v1/me', tokenInfo.accessToken);
    req.session.redditUsername = userInfo.name;
    
    // Redirect back to settings page
    res.redirect('/settings');
  } catch (error) {
    console.error("Error processing OAuth callback:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `Error processing authorization: ${errorMessage}` });
  }
});

/**
 * Route to check Reddit authentication status
 */
router.get("/api/auth/reddit/status", async (req: Request, res: Response) => {
  try {
    // Check if token exists in session
    if (!req.session.redditToken) {
      return res.json({ authenticated: false });
    }
    
    const tokenInfo = req.session.redditToken;
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime >= tokenInfo.expiresAt) {
      // Token is expired, try to refresh it
      try {
        const newTokenInfo = await redditAuth.refreshAccessToken(tokenInfo.refreshToken);
        req.session.redditToken = newTokenInfo;
      } catch (refreshError) {
        // Refresh failed, clear token from session
        delete req.session.redditToken;
        delete req.session.redditUsername;
        return res.json({ authenticated: false, error: "Token refresh failed, please re-authorize" });
      }
    }
    
    // At this point, we have a valid token
    return res.json({
      authenticated: true,
      username: req.session.redditUsername || "Unknown",
      scope: tokenInfo.scope,
      expiresAt: new Date(tokenInfo.expiresAt * 1000).toISOString()
    });
  } catch (error) {
    console.error("Error checking Reddit auth status:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      authenticated: false,
      error: `Error checking authentication status: ${errorMessage}`
    });
  }
});

/**
 * Route to disconnect Reddit account
 */
router.post("/api/auth/reddit/disconnect", (req: Request, res: Response) => {
  try {
    // Remove Reddit token from session
    delete req.session.redditToken;
    delete req.session.redditUsername;
    
    res.json({ success: true, message: "Reddit account disconnected successfully" });
  } catch (error) {
    console.error("Error disconnecting Reddit account:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: `Error disconnecting account: ${errorMessage}` });
  }
});

/**
 * Route to save Reddit API credentials
 */
router.post("/api/auth/reddit/credentials", (req: Request, res: Response) => {
  try {
    const { clientId, clientSecret, redirectUri } = req.body;
    
    // Validate required fields
    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required credentials (clientId, clientSecret, or redirectUri)" 
      });
    }
    
    // In a production environment, these would be stored securely
    // For development, we're storing them in environment variables
    process.env.REDDIT_CLIENT_ID = clientId;
    process.env.REDDIT_CLIENT_SECRET = clientSecret;
    process.env.REDDIT_REDIRECT_URI = redirectUri;
    
    console.log("Reddit API credentials saved successfully");
    
    res.json({ 
      success: true, 
      message: "Reddit API credentials saved successfully",
      hasCredentials: true
    });
  } catch (error) {
    console.error("Error saving Reddit credentials:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      success: false, 
      message: `Error saving Reddit credentials: ${errorMessage}` 
    });
  }
});

/**
 * Route to check if Reddit API credentials exist
 */
router.get("/api/auth/reddit/credentials", (req: Request, res: Response) => {
  try {
    const hasCredentials = redditAuth.hasRedditCredentials();
    
    res.json({
      success: true,
      hasCredentials
    });
  } catch (error) {
    console.error("Error checking Reddit credentials:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: `Error checking Reddit credentials: ${errorMessage}`
    });
  }
});

export default router;