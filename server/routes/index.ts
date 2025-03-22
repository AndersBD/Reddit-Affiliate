import express, { Request, Response } from "express";
import { getAuthorizationUrl, exchangeCodeForToken, refreshAccessToken, getAccessToken } from "../services/redditAuth";
import { randomBytes } from "crypto";
import "express-session";

// Extend the Express Request type to include our session properties
declare module "express-session" {
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

const router = express.Router();

/**
 * Route to initiate the OAuth flow by redirecting to Reddit's authorization page
 */
router.get("/api/auth/reddit/authorize", (req: Request, res: Response) => {
  // Generate a random state parameter to prevent CSRF attacks
  const state = randomBytes(20).toString("hex");
  
  // Store the state in the session to verify upon callback
  req.session.oauthState = state;
  
  // Redirect to Reddit's authorization page
  const authUrl = getAuthorizationUrl(state);
  res.redirect(authUrl);
});

/**
 * Route to handle OAuth callback from Reddit
 */
router.get("/api/auth/reddit/callback", async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    // Verify state parameter to prevent CSRF attacks
    if (state !== req.session.oauthState) {
      return res.status(400).send("Invalid state parameter. The request may have been tampered with.");
    }
    
    if (!code || typeof code !== "string") {
      return res.status(400).send("Missing authorization code.");
    }
    
    // Exchange the authorization code for an access token
    const tokenInfo = await exchangeCodeForToken(code);
    
    // Store the token info in the session
    req.session.redditToken = tokenInfo;
    
    // Display a success page that will close itself
    res.send(`
      <html>
        <head>
          <title>Reddit Authentication Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 20px;
              text-align: center;
              color: #333;
              background-color: #f9f9f9;
            }
            .card {
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              padding: 30px;
              max-width: 500px;
              width: 100%;
            }
            h1 {
              margin-top: 0;
              color: #FF5700;
            }
            .success-icon {
              color: #4CAF50;
              font-size: 48px;
              margin-bottom: 20px;
            }
            .button {
              background-color: #FF5700;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="success-icon">✓</div>
            <h1>Reddit Authentication Successful</h1>
            <p>You have successfully connected your Reddit account.</p>
            <p>You can now close this window and return to the application.</p>
            <button class="button" onclick="window.close()">Close Window</button>
          </div>
          <script>
            // Close the window automatically after 3 seconds
            setTimeout(function() {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error during Reddit OAuth callback:", error);
    res.status(500).send(`Authentication error: ${error.message}`);
  }
});

/**
 * Route to check Reddit authentication status
 */
router.get("/api/auth/reddit/status", async (req: Request, res: Response) => {
  try {
    // Check if token exists in session
    if (!req.session.redditToken) {
      return res.json({
        authenticated: false,
        error: "Not authenticated with Reddit"
      });
    }
    
    const tokenInfo = req.session.redditToken;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    // If token is expired, try to refresh it
    if (tokenInfo.expiresAt < currentTimestamp) {
      try {
        const refreshedToken = await refreshAccessToken(tokenInfo.refreshToken);
        req.session.redditToken = refreshedToken;
        
        return res.json({
          authenticated: true,
          username: req.session.redditUsername || "Unknown",
          scope: refreshedToken.scope,
          expiresAt: new Date(refreshedToken.expiresAt * 1000).toISOString()
        });
      } catch (refreshError) {
        return res.json({
          authenticated: false,
          error: "Failed to refresh token. Please authenticate again."
        });
      }
    }
    
    // Token is valid
    return res.json({
      authenticated: true,
      username: req.session.redditUsername || "Unknown",
      scope: tokenInfo.scope,
      expiresAt: new Date(tokenInfo.expiresAt * 1000).toISOString()
    });
  } catch (error) {
    console.error("Error checking Reddit auth status:", error);
    res.status(500).json({
      authenticated: false,
      error: `Error checking authentication status: ${error.message}`
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
    res.status(500).json({ success: false, message: `Error disconnecting account: ${error.message}` });
  }
});

export default router;