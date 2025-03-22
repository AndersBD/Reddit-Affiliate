import https from 'https';
import { InsertKeyword, InsertRedditOpportunity } from '@shared/schema';
import { storage } from '../storage';

// Simple utility to make HTTPS requests
async function makeHttpsRequest(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Parse Google search results to extract Reddit posts
 * This is a simple extraction that looks for reddit.com URLs in the HTML
 */
function extractRedditLinks(html: string): { url: string, title: string, snippet: string, rank: number }[] {
  const results: { url: string, title: string, snippet: string, rank: number }[] = [];
  
  // Simple regex pattern for finding Reddit links in Google search results
  const redditLinkPattern = /<a href="(https:\/\/www\.reddit\.com\/r\/[^"]+)"[^>]*>([^<]+)<\/a>.*?<div[^>]*>([^<]+)<\/div>/gi;
  let match;
  let rank = 1;
  
  while ((match = redditLinkPattern.exec(html)) !== null) {
    results.push({
      url: match[1],
      title: match[2].trim(),
      snippet: match[3].trim(),
      rank: rank++
    });
  }
  
  return results;
}

/**
 * Extract the subreddit name from a Reddit URL
 */
function extractSubredditFromUrl(url: string): string {
  const match = url.match(/reddit\.com\/r\/([^\/]+)/i);
  return match ? match[1] : '';
}

/**
 * Parse the Reddit post URL to estimate post date and extract post ID
 */
function parseRedditPostInfo(url: string): { postId: string } {
  // Extract the post ID from URL
  const postIdMatch = url.match(/comments\/([a-z0-9]+)\//i);
  const postId = postIdMatch ? postIdMatch[1] : '';
  
  return { postId };
}

/**
 * Calculate an opportunity score based on various factors
 * Higher score = better opportunity
 */
function calculateOpportunityScore(
  serpRank: number, 
  snippet: string,
  title: string,
  subreddit: string
): number {
  let score = 0;
  
  // SERP position is very important (higher positions get higher scores)
  score += Math.max(0, 10 - serpRank) * 10;
  
  // Check for question marks in title or snippet (questions are good opportunities)
  if (title.includes('?') || snippet.includes('?')) {
    score += 15;
  }
  
  // Check for phrases indicating people looking for recommendations
  const recommendationPhrases = [
    'recommend', 'suggestion', 'alternative', 'vs', 'versus', 'or', 
    'best', 'top', 'review', 'opinion', 'experience', 'worth it'
  ];
  
  const contentLower = (title + ' ' + snippet).toLowerCase();
  for (const phrase of recommendationPhrases) {
    if (contentLower.includes(phrase)) {
      score += 8;
      break;
    }
  }
  
  // Normalize to 0-1 range
  return Math.min(Math.max(score / 100, 0), 1);
}

/**
 * Determine if we should comment on a post or create a new post
 */
function determineActionType(score: number, title: string, snippet: string): 'comment' | 'post' {
  // Check for phrases that indicate it's better to comment
  const commentPhrases = [
    'anyone recommend', 'what should i', 'help me', 'looking for', 
    'need advice', 'which one', 'alternative to'
  ];
  
  const contentLower = (title + ' ' + snippet).toLowerCase();
  
  for (const phrase of commentPhrases) {
    if (contentLower.includes(phrase)) {
      return 'comment';
    }
  }
  
  // Default to creating a post if the score is high enough, otherwise comment
  return score > 0.7 ? 'post' : 'comment';
}

/**
 * Search Google for Reddit posts matching a keyword
 */
export async function searchRedditOpportunities(keyword: string): Promise<InsertRedditOpportunity[]> {
  try {
    // Encode the keyword for use in a URL
    const encodedKeyword = encodeURIComponent(keyword);
    const encodedSiteQuery = encodeURIComponent(`site:reddit.com ${keyword}`);
    
    // Create a Google search URL
    const searchUrl = `https://www.google.com/search?q=${encodedSiteQuery}&num=10`;
    
    // Execute the search
    const response = await makeHttpsRequest(searchUrl);
    
    // Extract Reddit links from the search results
    const redditLinks = extractRedditLinks(response);
    
    // Create opportunities from the links
    const opportunities: InsertRedditOpportunity[] = [];
    
    // Get the existing keyword or create a new one
    let keywordObj = await storage.getKeywordByText(keyword);
    
    if (!keywordObj) {
      const newKeyword: InsertKeyword = {
        keyword,
        status: 'active',
      };
      keywordObj = await storage.createKeyword(newKeyword);
    }
    
    for (const link of redditLinks) {
      // Skip if the URL is already in our database
      const existingOpportunity = await storage.getRedditOpportunityByUrl(link.url);
      if (existingOpportunity) continue;
      
      const subreddit = extractSubredditFromUrl(link.url);
      const { postId } = parseRedditPostInfo(link.url);
      
      // Calculate opportunity score
      const opportunityScore = calculateOpportunityScore(
        link.rank, 
        link.snippet,
        link.title,
        subreddit
      );
      
      // Determine if we should comment or create a new post
      const actionType = determineActionType(opportunityScore, link.title, link.snippet);
      
      const opportunity: InsertRedditOpportunity = {
        keywordId: keywordObj.id,
        keyword: keyword,
        redditPostUrl: link.url,
        title: link.title,
        snippet: link.snippet,
        serpRank: link.rank,
        subreddit,
        linkable: true,
        opportunityScore,
        actionType,
        status: 'new',
      };
      
      opportunities.push(opportunity);
    }
    
    return opportunities;
  } catch (error) {
    console.error('Error searching Reddit opportunities:', error);
    return [];
  }
}

/**
 * Process a batch of keywords and find opportunities
 */
export async function batchProcessKeywords(limit: number = 10): Promise<number> {
  try {
    // Get keywords that need processing
    const keywords = await storage.getKeywords();
    const activeKeywords = keywords
      .filter(k => k.status === 'active')
      .sort((a, b) => {
        // Sort by last scanned (null/undefined is treated as oldest)
        if (!a.lastScanned) return -1;
        if (!b.lastScanned) return 1;
        return a.lastScanned.getTime() - b.lastScanned.getTime();
      })
      .slice(0, limit);
    
    if (activeKeywords.length === 0) {
      return 0;
    }
    
    let totalOpportunities = 0;
    
    // Process each keyword
    for (const keyword of activeKeywords) {
      // Search for opportunities
      const opportunities = await searchRedditOpportunities(keyword.keyword);
      
      // Store opportunities in database
      for (const opportunity of opportunities) {
        await storage.createRedditOpportunity(opportunity);
        totalOpportunities++;
      }
      
      // Update keyword's last scanned timestamp
      await storage.updateKeyword(keyword.id, {
        lastScanned: new Date(),
      });
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return totalOpportunities;
  } catch (error) {
    console.error('Error in batch processing keywords:', error);
    return 0;
  }
}

/**
 * Score opportunities and determine which ones to act on
 */
export async function scoreAndQueueOpportunities(): Promise<number> {
  try {
    // Get new opportunities
    const opportunities = await storage.getRedditOpportunitiesByStatus('new');
    
    if (opportunities.length === 0) {
      return 0;
    }
    
    let queuedCount = 0;
    
    // Sort by opportunity score (descending)
    opportunities.sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0));
    
    // Take the top 10 opportunities
    const topOpportunities = opportunities.slice(0, 10);
    
    for (const opportunity of topOpportunities) {
      // Mark as queued
      await storage.updateRedditOpportunity(opportunity.id, {
        status: 'queued'
      });
      
      queuedCount++;
    }
    
    return queuedCount;
  } catch (error) {
    console.error('Error in scoring and queuing opportunities:', error);
    return 0;
  }
}