import pkg from 'pg';
const { Pool } = pkg;

// PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database initialization
export async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS affiliate_programs (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        website TEXT,
        commission_rate DOUBLE PRECISION,
        commission_type TEXT,
        payout_threshold DOUBLE PRECISION,
        payout_frequency TEXT,
        category TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subreddits (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        subscribers INTEGER,
        posting_rules TEXT,
        best_time_to_post TEXT,
        category_tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        affiliate_program_id INTEGER NOT NULL,
        description TEXT,
        target_subreddits TEXT[],
        status TEXT NOT NULL,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        budget DOUBLE PRECISION,
        schedule JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reddit_posts (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL,
        subreddit_name TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT NOT NULL,
        post_type TEXT NOT NULL,
        reddit_post_id TEXT,
        scheduled_time TIMESTAMP,
        posted_time TIMESTAMP,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        affiliate_link TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS performance_metrics (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL,
        date TIMESTAMP NOT NULL,
        clicks INTEGER DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        revenue DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        details JSONB,
        timestamp TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS content_templates (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        template TEXT NOT NULL,
        content_type TEXT NOT NULL,
        category TEXT,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT UNIQUE,
        api_usage_limit INTEGER DEFAULT 1000,
        api_usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Helper functions for database operations
export async function query(text: string, params: any[] = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Convert snake_case database fields to camelCase for JavaScript
export function toCamelCase(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => toCamelCase(item));
  }
  
  if (data !== null && typeof data === 'object') {
    const newObj: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        newObj[camelKey] = toCamelCase(data[key]);
      }
    }
    return newObj;
  }
  
  return data;
}

// Convert camelCase JavaScript properties to snake_case for database
export function toSnakeCase(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => toSnakeCase(item));
  }
  
  if (data !== null && typeof data === 'object') {
    const newObj: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        newObj[snakeKey] = toSnakeCase(data[key]);
      }
    }
    return newObj;
  }
  
  return data;
}