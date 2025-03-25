import pkg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';
import { DATABASE_CONFIG } from './config';

const { Pool } = pkg;

// PostgreSQL connection pool
export const pool = new Pool({
  connectionString: DATABASE_CONFIG.url,
  ssl: DATABASE_CONFIG.ssl
});

// Create drizzle db instance 
export const db = drizzle(pool, { schema });

// Database initialization
export async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Verify connection to database
    await pool.query('SELECT NOW()');
    
    // We'll use drizzle-kit push for schema migrations
    // This is already configured in package.json as "db:push" script
    // But here we'll just report success as we've verified connection
    
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