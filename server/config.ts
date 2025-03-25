// Configuration settings for the application

// Port configuration
// Note: Replit workflow expects port 5000 for web view
export const PORT = process.env.PORT || 5000;

// Database configuration
export const DATABASE_CONFIG = {
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Reddit API configuration
export const REDDIT_CONFIG = {
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  redirectUri: process.env.REDDIT_REDIRECT_URI || `http://localhost:${PORT}/api/auth/reddit/callback`,
  userAgent: 'web:affiliate-automation:v1.0 (by /u/YourUsername)',
  scope: ['identity', 'submit', 'read', 'edit']
};

// OpenAI API configuration
export const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o' // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
};

// Perplexity API configuration
export const PERPLEXITY_CONFIG = {
  apiKey: process.env.PERPLEXITY_API_KEY,
  model: 'llama-3.1-sonar-small-128k-online'
};

// Session configuration
export const SESSION_CONFIG = {
  secret: process.env.SESSION_SECRET || 'affiliate-marketing-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

// Path configuration
export const PATHS = {
  client: process.env.NODE_ENV === 'production' ? 'dist/client' : '../client',
  public: process.env.NODE_ENV === 'production' ? 'dist/client' : '../client/public'
};