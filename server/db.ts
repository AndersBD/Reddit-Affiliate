import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

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
        name VARCHAR(255) NOT NULL,
        description TEXT,
        website VARCHAR(255),
        commission_rate DECIMAL,
        commission_type VARCHAR(255),
        payout_threshold DECIMAL,
        payout_frequency VARCHAR(255),
        category VARCHAR(255),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subreddits (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        subscribers INTEGER,
        active BOOLEAN DEFAULT true,
        post_frequency VARCHAR(255),
        best_time_to_post VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        affiliate_program_id INTEGER REFERENCES affiliate_programs(id),
        status VARCHAR(50) DEFAULT 'draft',
        target_subreddits TEXT[],
        schedule JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reddit_posts (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id),
        title VARCHAR(300) NOT NULL,
        content TEXT,
        subreddit VARCHAR(255) NOT NULL,
        scheduled_time TIMESTAMP,
        posted_time TIMESTAMP,
        status VARCHAR(50) DEFAULT 'draft',
        reddit_post_id VARCHAR(255),
        affiliate_link VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS performance_metrics (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id),
        post_id INTEGER REFERENCES reddit_posts(id),
        date DATE,
        clicks INTEGER DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        revenue DECIMAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id),
        type VARCHAR(50),
        message TEXT,
        details JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS content_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        content_type VARCHAR(50),
        template_text TEXT,
        target_keywords TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        api_usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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