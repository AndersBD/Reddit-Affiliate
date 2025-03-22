import express from 'express';
import { getAuthorizationUrl, exchangeCodeForToken } from '../services/redditAuth';
import crypto from 'crypto';

const router = express.Router();

// State storage to prevent CSRF attacks
const stateStore: Record<string, { timestamp: number }> = {};

// Clean up expired states every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(stateStore).forEach(state => {
    if (now - stateStore[state].timestamp > 3600000) { // 1 hour expiration
      delete stateStore[state];
    }
  });
}, 3600000); // Run every hour

/**
 * Route to initiate Reddit OAuth flow
 */
router.get('/auth/reddit', (req, res) => {
  try {
    // Generate a random state parameter to prevent CSRF attacks
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store the state parameter with a timestamp
    stateStore[state] = { timestamp: Date.now() };
    
    // Generate the authorization URL
    const authUrl = getAuthorizationUrl(state);
    
    // Redirect user to the Reddit authorization page
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Reddit OAuth flow:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate Reddit authorization' 
    });
  }
});

/**
 * Route to handle OAuth callback from Reddit
 */
router.get('/auth/reddit/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    // Check if there was an error in the OAuth process
    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: `Reddit authorization error: ${error}` 
      });
    }
    
    // Validate the state parameter to prevent CSRF attacks
    if (!state || !stateStore[state as string]) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid state parameter' 
      });
    }
    
    // Remove the state from the store as it's been used
    delete stateStore[state as string];
    
    // Validate that code is provided
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'No authorization code provided' 
      });
    }
    
    // Exchange the code for an access token
    const tokenInfo = await exchangeCodeForToken(code as string);
    
    // Send success response
    // In a real app, you might redirect to a success page
    res.json({ 
      success: true, 
      message: 'Reddit account connected successfully',
      scope: tokenInfo.scope,
      expiresAt: new Date(tokenInfo.expiresAt).toISOString()
    });
  } catch (error) {
    console.error('Error handling Reddit OAuth callback:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to complete Reddit authorization' 
    });
  }
});

/**
 * Route to check Reddit authentication status
 */
router.get('/auth/status', async (req, res) => {
  try {
    // For MVP - just return a fake success
    res.json({
      authenticated: true,
      username: 'demo_user',
      scope: ['identity', 'submit', 'read'].join(' '),
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour in the future
    });
  } catch (error) {
    console.error('Error checking Reddit auth status:', error);
    res.json({
      authenticated: false,
      error: 'Not authenticated with Reddit'
    });
  }
});

/**
 * Route to disconnect Reddit account
 */
router.post('/auth/disconnect', async (req, res) => {
  try {
    // For MVP - just return success
    res.json({
      success: true,
      message: 'Reddit account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Reddit account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Reddit account'
    });
  }
});

export default router;