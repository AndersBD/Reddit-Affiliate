/**
 * Reddit Crawler Integration Service
 * 
 * This service provides an interface between the Node.js backend and the Python Reddit crawler.
 * It handles reading crawler data, running the crawler on demand, and mapping the data to our schemas.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { InsertRedditOpportunity } from '@shared/schema';

// Constants
const DATA_DIR = path.join(__dirname, '..', '..', 'crawler', 'data');
const OPPORTUNITIES_PATH = path.join(DATA_DIR, 'opportunities.json');
const STATUS_PATH = path.join(DATA_DIR, 'status.json');
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
const CRAWLER_SCRIPT = path.join(__dirname, '..', '..', 'crawler', 'run_crawler.py');

interface CrawlerStatus {
  status: 'idle' | 'running' | 'completed' | 'error';
  lastUpdated: string;
  details?: {
    threadsFound?: number;
    opportunitiesFound?: number;
    newOpportunities?: number;
    elapsedSeconds?: number;
    completionTime?: string;
    error?: string;
  };
}

interface CrawlerOpportunity {
  thread_id: string;
  title: string;
  body: string;
  subreddit: string;
  url: string;
  upvotes: number;
  comments: number;
  created_utc: string;
  fetched_at: string;
  intent: string;
  affiliate_matches: Array<{
    keyword: string;
    program_name: string;
    program_id: number;
    match_strength: number;
  }>;
  opportunity_score: number;
  action_type: 'comment' | 'post';
  priority: 'high' | 'medium' | 'low';
  status: 'new' | 'queued' | 'processed' | 'ignored';
  processed_at: string;
}

/**
 * Check if the crawler data directory exists and create it if needed
 */
function ensureDataDir(): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Error ensuring data directory exists:', error);
    return false;
  }
}

/**
 * Get the current status of the crawler
 */
export async function getCrawlerStatus(): Promise<CrawlerStatus> {
  try {
    if (!fs.existsSync(STATUS_PATH)) {
      return {
        status: 'idle',
        lastUpdated: new Date().toISOString()
      };
    }

    const statusData = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf8'));
    
    return {
      status: statusData.status,
      lastUpdated: statusData.last_updated,
      details: statusData.details
    };
  } catch (error) {
    console.error('Error getting crawler status:', error);
    return {
      status: 'error',
      lastUpdated: new Date().toISOString(),
      details: { error: String(error) }
    };
  }
}

/**
 * Run the crawler script
 */
export async function runCrawler(forceRun: boolean = false, subreddits?: string[]): Promise<boolean> {
  if (!ensureDataDir()) {
    return false;
  }

  return new Promise((resolve) => {
    try {
      const args = [CRAWLER_SCRIPT];
      
      if (forceRun) {
        args.push('--force');
      }
      
      if (subreddits && subreddits.length > 0) {
        args.push('--subreddits', ...subreddits);
      }
      
      console.log(`Running crawler: ${PYTHON_PATH} ${args.join(' ')}`);
      
      const crawler = spawn(PYTHON_PATH, args);
      
      crawler.stdout.on('data', (data) => {
        console.log(`Crawler: ${data.toString().trim()}`);
      });
      
      crawler.stderr.on('data', (data) => {
        console.error(`Crawler error: ${data.toString().trim()}`);
      });
      
      crawler.on('close', (code) => {
        console.log(`Crawler process exited with code ${code}`);
        resolve(code === 0);
      });
      
    } catch (error) {
      console.error('Error running crawler:', error);
      resolve(false);
    }
  });
}

/**
 * Get opportunities from the crawler
 */
export async function getCrawlerOpportunities(limit?: number): Promise<CrawlerOpportunity[]> {
  try {
    if (!fs.existsSync(OPPORTUNITIES_PATH)) {
      return [];
    }

    const opportunities: CrawlerOpportunity[] = JSON.parse(fs.readFileSync(OPPORTUNITIES_PATH, 'utf8'));
    
    // Sort by score
    opportunities.sort((a, b) => b.opportunity_score - a.opportunity_score);
    
    // Apply limit if provided
    if (limit && limit > 0) {
      return opportunities.slice(0, limit);
    }
    
    return opportunities;
  } catch (error) {
    console.error('Error getting crawler opportunities:', error);
    return [];
  }
}

/**
 * Get crawler opportunity by ID
 */
export async function getCrawlerOpportunityById(threadId: string): Promise<CrawlerOpportunity | null> {
  try {
    const opportunities = await getCrawlerOpportunities();
    return opportunities.find(opp => opp.thread_id === threadId) || null;
  } catch (error) {
    console.error('Error getting crawler opportunity by ID:', error);
    return null;
  }
}

/**
 * Convert crawler opportunity to database InsertRedditOpportunity schema
 */
export function convertToDbOpportunity(opportunity: CrawlerOpportunity): InsertRedditOpportunity {
  // Get the first affiliate match to use for keywordId
  const firstMatch = opportunity.affiliate_matches[0];
  const keywordId = firstMatch ? firstMatch.program_id : 1; // Default to 1 if no match
  
  return {
    keywordId,
    url: opportunity.url,
    title: opportunity.title,
    snippet: opportunity.body || '',
    subreddit: opportunity.subreddit,
    actionType: opportunity.action_type,
    opportunityScore: opportunity.opportunity_score,
    status: 'new',
    priority: opportunity.priority,
    intent: opportunity.intent,
    upvotes: opportunity.upvotes,
    commentCount: opportunity.comments,
    postDate: new Date(opportunity.created_utc || Date.now()),
    sourceType: 'crawler',
    affiliateMatches: opportunity.affiliate_matches.map(match => match.program_name).join(', ')
  };
}

/**
 * Update the status of a crawler opportunity
 */
export async function updateOpportunityStatus(threadId: string, status: 'new' | 'queued' | 'processed' | 'ignored'): Promise<boolean> {
  try {
    if (!fs.existsSync(OPPORTUNITIES_PATH)) {
      return false;
    }

    const opportunities: CrawlerOpportunity[] = JSON.parse(fs.readFileSync(OPPORTUNITIES_PATH, 'utf8'));
    
    // Find and update the opportunity
    const opportunityIndex = opportunities.findIndex(opp => opp.thread_id === threadId);
    if (opportunityIndex === -1) {
      return false;
    }
    
    opportunities[opportunityIndex].status = status;
    
    // Save the updated opportunities
    fs.writeFileSync(OPPORTUNITIES_PATH, JSON.stringify(opportunities, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error updating opportunity status:', error);
    return false;
  }
}

/**
 * Initialize the crawler integration
 */
export async function initializeCrawlerIntegration(): Promise<void> {
  console.log('Initializing crawler integration...');
  ensureDataDir();
  
  // Check if opportunities file exists, if not run the crawler once
  if (!fs.existsSync(OPPORTUNITIES_PATH)) {
    console.log('No opportunities file found, running initial crawler...');
    await runCrawler(true);
  }
}