import { storage } from '../storage';
import { RedditOpportunity, InsertRedditOpportunity, AffiliateProgram } from '@shared/schema';
import { getAccessToken } from './redditAuth';
import { determineThreadIntent } from './opportunity-analyzer';
import { analyzeOpportunity } from './opportunity-analyzer';
import { REDDIT_CONFIG } from '../config';
import { createOpenAIClient } from './openai';

/**
 * Interface representing a Reddit thread with necessary metadata
 */
interface RedditThread {
  id: string;
  subreddit: string;
  title: string;
  body: string;
  author: string;
  flair: string | null;
  upvotes: number;
  comments: number;
  created_utc: number;
  permalink: string;
  url: string;
}

/**
 * Fetch live threads from Reddit API for a specific subreddit
 * @param subredditName The name of the subreddit to fetch from
 * @param mode The sort mode (new, hot, top, rising)
 * @param limit Maximum number of threads to fetch
 */
async function fetchThreadsFromSubreddit(
  subredditName: string,
  mode: 'new' | 'hot' | 'top' | 'rising' = 'hot',
  limit: number = 50
): Promise<RedditThread[]> {
  try {
    // Remove 'r/' prefix if present
    const normalizedSubredditName = subredditName.replace(/^r\//, '');
    
    // Get Reddit access token
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      console.error('Failed to get Reddit access token');
      return [];
    }
    
    // Fetch threads from the subreddit
    const url = `https://oauth.reddit.com/r/${normalizedSubredditName}/${mode}?limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': REDDIT_CONFIG.userAgent
      }
    });
    
    if (!response.ok) {
      console.error(`Error fetching threads from r/${normalizedSubredditName}: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    
    // Transform Reddit API response to our RedditThread format
    const threads: RedditThread[] = data.data.children.map((child: any) => {
      const post = child.data;
      return {
        id: post.id,
        subreddit: post.subreddit_name_prefixed || `r/${post.subreddit}`,
        title: post.title,
        body: post.selftext || '',
        author: post.author,
        flair: post.link_flair_text,
        upvotes: post.ups,
        comments: post.num_comments,
        created_utc: post.created_utc,
        permalink: post.permalink,
        url: `https://www.reddit.com${post.permalink}`
      };
    });
    
    return threads;
  } catch (error) {
    console.error(`Error fetching threads from r/${subredditName}:`, error);
    return [];
  }
}

/**
 * Process a single Reddit thread and convert it to an opportunity
 */
async function processThreadToOpportunity(
  thread: RedditThread,
  keywordId: number,
  keyword: string
): Promise<InsertRedditOpportunity> {
  // Calculate opportunity score and determine action type
  const intent = determineThreadIntent(thread.title, thread.body);
  const score = calculateOpportunityScore(thread, intent);
  const actionType = determineActionType(score, thread);
  
  // Create opportunity object
  const opportunity: InsertRedditOpportunity = {
    keywordId,
    keyword,
    redditPostUrl: thread.url,
    url: thread.url,
    title: thread.title,
    snippet: thread.body.substring(0, 500), // Limit snippet length
    serpRank: 0, // Not from SERP, so set to 0
    postDate: new Date(thread.created_utc * 1000),
    upvotes: thread.upvotes,
    subreddit: thread.subreddit,
    linkable: true,
    opportunityScore: score,
    priority: getPriorityFromScore(score),
    actionType,
    status: 'new'
  };
  
  return opportunity;
}

/**
 * Calculate opportunity score for a Reddit thread
 */
function calculateOpportunityScore(thread: RedditThread, intent: string): number {
  let score = 50; // Base score
  
  // Adjust based on upvotes
  if (thread.upvotes > 1000) {
    score += 20;
  } else if (thread.upvotes > 500) {
    score += 15;
  } else if (thread.upvotes > 100) {
    score += 10;
  } else if (thread.upvotes > 10) {
    score += 5;
  }
  
  // Adjust based on comments
  if (thread.comments > 50) {
    score += 15;
  } else if (thread.comments > 25) {
    score += 10;
  } else if (thread.comments > 10) {
    score += 5;
  }
  
  // Adjust based on content length
  if (thread.body && thread.body.length > 1000) {
    score += 10; // Longer content means more context
  }
  
  // Adjust based on intent
  switch (intent) {
    case 'DISCOVERY':
      score += 20; // High value for product discovery
      break;
    case 'QUESTION':
      score += 15; // Good for direct answers
      break;
    case 'COMPARISON':
      score += 10; // Good for comparison
      break;
    case 'SHOWCASE':
      score -= 5; // Lower value as they're already showcasing something
      break;
    default:
      break;
  }
  
  // Cap score between 0-100
  return Math.min(100, Math.max(0, score));
}

/**
 * Determine the best action type for an opportunity
 */
function determineActionType(score: number, thread: RedditThread): 'comment' | 'post' {
  // Posts with high engagement are better for comments
  if (thread.comments > 5 && score > 40) {
    return 'comment';
  }
  
  // Very high scoring threads might be worth creating a separate post about
  if (score > 80) {
    return 'post';
  }
  
  // Default to comment
  return 'comment';
}

/**
 * Get priority level based on opportunity score
 */
function getPriorityFromScore(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Match a Reddit thread with suitable affiliate programs
 */
async function matchWithAffiliatePrograms(
  thread: RedditThread
): Promise<number[]> {
  try {
    // Get all affiliate programs
    const programs = await storage.getAffiliatePrograms();
    
    if (!programs.length) {
      return [];
    }
    
    // Simple keyword matching - can be enhanced later
    const threadContent = `${thread.title} ${thread.body}`.toLowerCase();
    const matches: {programId: number, relevance: number}[] = [];
    
    for (const program of programs) {
      let relevance = 0;
      
      // Check program name match
      if (threadContent.includes(program.name.toLowerCase())) {
        relevance += 50;
      }
      
      // Check category match
      if (program.category && threadContent.includes(program.category.toLowerCase())) {
        relevance += 30;
      }
      
      // Check tags match
      if (program.tags) {
        for (const tag of program.tags) {
          if (threadContent.includes(tag.toLowerCase())) {
            relevance += 10;
            break;
          }
        }
      }
      
      if (relevance > 0) {
        matches.push({
          programId: program.id,
          relevance
        });
      }
    }
    
    // Sort by relevance and return IDs
    return matches
      .sort((a, b) => b.relevance - a.relevance)
      .map(match => match.programId);
  } catch (error) {
    console.error('Error matching with affiliate programs:', error);
    return [];
  }
}

/**
 * Fetch and process live threads from multiple subreddits
 * @param subreddits List of subreddit names to fetch from
 * @param mode The sort mode
 * @param limit Max threads per subreddit
 */
export async function fetchOpportunities(
  subreddits?: string[],
  mode: 'new' | 'hot' | 'top' | 'rising' = 'hot',
  limit: number = 25
): Promise<RedditOpportunity[]> {
  try {
    // If no subreddits provided, get them from subreddit category mappings
    if (!subreddits || subreddits.length === 0) {
      const allSubreddits = await storage.getSubreddits();
      subreddits = allSubreddits.map(s => s.name);
    }
    
    const opportunities: RedditOpportunity[] = [];
    const keyword = 'reddit-live-fetch'; // Default keyword for tracking
    
    // Find or create the keyword
    let keywordObj = await storage.getKeywordByText(keyword);
    if (!keywordObj) {
      keywordObj = await storage.createKeyword({
        keyword,
        status: 'active'
      });
    }
    
    // Process each subreddit
    for (const subreddit of subreddits) {
      console.log(`Fetching threads from ${subreddit}...`);
      const threads = await fetchThreadsFromSubreddit(subreddit, mode, limit);
      
      for (const thread of threads) {
        // Check if opportunity already exists
        const existingOpportunity = await storage.getRedditOpportunityByUrl(thread.url);
        if (existingOpportunity) {
          console.log(`Opportunity already exists for thread: ${thread.id}`);
          opportunities.push(existingOpportunity);
          continue;
        }
        
        // Process thread to opportunity
        const newOpportunity = await processThreadToOpportunity(thread, keywordObj.id, keyword);
        
        // Match with affiliate programs
        const programIds = await matchWithAffiliatePrograms(thread);
        if (programIds.length > 0) {
          newOpportunity.affiliateProgramId = programIds[0]; // Use the most relevant program
        }
        
        // Save the opportunity
        const savedOpportunity = await storage.createRedditOpportunity(newOpportunity);
        opportunities.push(savedOpportunity);
        
        // Add some delay to avoid overwhelming APIs
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return opportunities;
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return [];
  }
}

/**
 * Set up a scheduled job to fetch opportunities periodically
 */
export function setupOpportunityFetchSchedule(intervalHours: number = 6): NodeJS.Timeout {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  console.log(`Setting up scheduled opportunity fetch every ${intervalHours} hours`);
  
  // Initial fetch
  fetchOpportunities().catch(err => {
    console.error('Error in initial opportunity fetch:', err);
  });
  
  // Schedule regular fetches
  return setInterval(() => {
    console.log('Running scheduled opportunity fetch...');
    fetchOpportunities().catch(err => {
      console.error('Error in scheduled opportunity fetch:', err);
    });
  }, intervalMs);
}

/**
 * Initialize the opportunity fetcher
 */
export function initializeOpportunityFetcher(): void {
  setupOpportunityFetchSchedule();
}