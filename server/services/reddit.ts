import { storage } from '../storage';

// Reddit API rate limit (Free tier)
const RATE_LIMIT = {
  requests: 100, // Requests per hour
  interval: 60 * 60 * 1000, // 1 hour in milliseconds
};

// Track API usage to respect rate limits
let apiUsage = {
  count: 0,
  resetTime: Date.now() + RATE_LIMIT.interval,
};

// Reset API usage counter periodically
setInterval(() => {
  apiUsage.count = 0;
  apiUsage.resetTime = Date.now() + RATE_LIMIT.interval;
}, RATE_LIMIT.interval);

// Check if we're within rate limits
function checkRateLimit(): boolean {
  if (apiUsage.count >= RATE_LIMIT.requests) {
    return false;
  }
  
  apiUsage.count++;
  return true;
}

// Get Reddit API credentials from environment variables
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || '';
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || '';
const REDDIT_USERNAME = process.env.REDDIT_USERNAME || '';
const REDDIT_PASSWORD = process.env.REDDIT_PASSWORD || '';

let accessToken: string | null = null;
let tokenExpiration: number = 0;

// Get or refresh Reddit access token
async function getAccessToken(): Promise<string> {
  if (accessToken && tokenExpiration > Date.now()) {
    return accessToken;
  }

  try {
    // In a real application, this would make an actual Reddit API call
    // to get an access token using the OAuth endpoint
    
    // For this demo, we'll simulate the token acquisition
    accessToken = 'simulated_access_token';
    tokenExpiration = Date.now() + (60 * 60 * 1000); // 1 hour expiration
    
    return accessToken;
  } catch (error) {
    console.error('Error getting Reddit access token:', error);
    throw new Error('Failed to authenticate with Reddit API');
  }
}

// Create a new Reddit post
export async function createRedditPost(
  subreddit: string,
  title: string,
  content: string,
  postId: number
): Promise<{ success: boolean; redditPostId?: string; error?: string }> {
  if (!checkRateLimit()) {
    return {
      success: false,
      error: 'Reddit API rate limit exceeded. Try again later.',
    };
  }

  try {
    const token = await getAccessToken();

    // In a real application, this would make an actual Reddit API call
    // to create a post on the specified subreddit
    
    // Simulate post creation with delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a fake Reddit post ID
    const redditPostId = `t3_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update the post in our storage with the "posted" status
    const post = await storage.getRedditPost(postId);
    if (post) {
      await storage.updateRedditPost(postId, {
        status: 'posted',
        redditPostId,
        postedTime: new Date(),
      });
      
      // Log the activity
      await storage.createActivity({
        campaignId: post.campaignId,
        type: 'post_published',
        message: `Post published to ${subreddit}`,
        details: { postId, redditPostId, subreddit },
      });
    }
    
    return {
      success: true,
      redditPostId,
    };
  } catch (error) {
    console.error('Error creating Reddit post:', error);
    return {
      success: false,
      error: 'Failed to create Reddit post',
    };
  }
}

// Post a comment on a Reddit thread
export async function postComment(
  redditPostId: string,
  content: string
): Promise<{ success: boolean; commentId?: string; error?: string }> {
  if (!checkRateLimit()) {
    return {
      success: false,
      error: 'Reddit API rate limit exceeded. Try again later.',
    };
  }

  try {
    const token = await getAccessToken();

    // In a real application, this would make an actual Reddit API call
    // to post a comment on the specified thread
    
    // Simulate comment posting with delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate a fake Reddit comment ID
    const commentId = `t1_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      commentId,
    };
  } catch (error) {
    console.error('Error posting Reddit comment:', error);
    return {
      success: false,
      error: 'Failed to post comment on Reddit',
    };
  }
}

// Get posts from a subreddit
export async function getSubredditPosts(
  subreddit: string,
  sort: 'hot' | 'new' | 'top' = 'hot',
  limit: number = 25
): Promise<Array<{
  id: string;
  title: string;
  content: string;
  author: string;
  upvotes: number;
  comments: number;
  created: number;
}>> {
  if (!checkRateLimit()) {
    throw new Error('Reddit API rate limit exceeded. Try again later.');
  }

  try {
    const token = await getAccessToken();

    // In a real application, this would make an actual Reddit API call
    // to get posts from the specified subreddit
    
    // For demo purposes, generate mock posts
    const mockPosts = Array(limit).fill(0).map((_, index) => ({
      id: `t3_${Math.random().toString(36).substr(2, 9)}`,
      title: `Sample post ${index + 1} in ${subreddit}`,
      content: `This is sample content for post ${index + 1} in ${subreddit}.`,
      author: `user${Math.floor(Math.random() * 1000)}`,
      upvotes: Math.floor(Math.random() * 1000),
      comments: Math.floor(Math.random() * 100),
      created: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in the past week
    }));
    
    return mockPosts;
  } catch (error) {
    console.error('Error getting subreddit posts:', error);
    throw new Error('Failed to fetch posts from subreddit');
  }
}

// Get comments on a Reddit post
export async function getPostComments(
  redditPostId: string
): Promise<Array<{
  id: string;
  content: string;
  author: string;
  upvotes: number;
  created: number;
}>> {
  if (!checkRateLimit()) {
    throw new Error('Reddit API rate limit exceeded. Try again later.');
  }

  try {
    const token = await getAccessToken();

    // In a real application, this would make an actual Reddit API call
    // to get comments on the specified post
    
    // For demo purposes, generate mock comments
    const commentCount = Math.floor(Math.random() * 10) + 1;
    const mockComments = Array(commentCount).fill(0).map((_, index) => ({
      id: `t1_${Math.random().toString(36).substr(2, 9)}`,
      content: `This is a sample comment ${index + 1} on this post.`,
      author: `user${Math.floor(Math.random() * 1000)}`,
      upvotes: Math.floor(Math.random() * 50),
      created: Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000), // Random time in the past day
    }));
    
    return mockComments;
  } catch (error) {
    console.error('Error getting post comments:', error);
    throw new Error('Failed to fetch comments from post');
  }
}

// Get information about a subreddit
export async function getSubredditInfo(
  subreddit: string
): Promise<{
  name: string;
  subscribers: number;
  description: string;
  rules: string[];
  created: number;
}> {
  if (!checkRateLimit()) {
    throw new Error('Reddit API rate limit exceeded. Try again later.');
  }

  try {
    const token = await getAccessToken();

    // In a real application, this would make an actual Reddit API call
    // to get information about the specified subreddit
    
    // For demo purposes, return mock info
    return {
      name: subreddit,
      subscribers: Math.floor(Math.random() * 1000000) + 10000,
      description: `This is a subreddit about ${subreddit.replace('r/', '')}.`,
      rules: [
        'Be respectful to others',
        'No spam or self-promotion',
        'Posts must be related to the subreddit topic',
        'No low-effort content',
        'Follow Reddit\'s content policy',
      ],
      created: Date.now() - Math.floor(Math.random() * 5 * 365 * 24 * 60 * 60 * 1000), // Random time in the past 5 years
    };
  } catch (error) {
    console.error('Error getting subreddit info:', error);
    throw new Error('Failed to fetch subreddit information');
  }
}

// Update post stats (upvotes, comments, etc.)
export async function updatePostStats(
  internalPostId: number,
  redditPostId: string
): Promise<{
  upvotes: number;
  downvotes: number;
  commentCount: number;
}> {
  if (!checkRateLimit()) {
    throw new Error('Reddit API rate limit exceeded. Try again later.');
  }

  try {
    const token = await getAccessToken();

    // In a real application, this would make an actual Reddit API call
    // to get updated statistics for the post
    
    // For demo purposes, generate mock stats
    const upvotes = Math.floor(Math.random() * 100);
    const downvotes = Math.floor(Math.random() * 20);
    const commentCount = Math.floor(Math.random() * 15);
    
    // Update the post in our storage with the new stats
    const post = await storage.getRedditPost(internalPostId);
    if (post) {
      await storage.updateRedditPost(internalPostId, {
        upvotes,
        downvotes,
        commentCount,
      });
    }
    
    return {
      upvotes,
      downvotes,
      commentCount,
    };
  } catch (error) {
    console.error('Error updating post stats:', error);
    throw new Error('Failed to update post statistics');
  }
}

// Get the current API usage and rate limit status
export function getApiUsageStatus(): {
  used: number;
  limit: number;
  resetTime: number;
  remainingPercent: number;
} {
  return {
    used: apiUsage.count,
    limit: RATE_LIMIT.requests,
    resetTime: apiUsage.resetTime,
    remainingPercent: ((RATE_LIMIT.requests - apiUsage.count) / RATE_LIMIT.requests) * 100,
  };
}

// Determine the best time to post based on subreddit activity
export async function analyzeBestPostingTime(
  subreddit: string
): Promise<{
  bestDays: string[];
  bestTimeRanges: string[];
  confidence: number;
}> {
  // In a real application, this would analyze actual subreddit data
  // to determine the optimal posting times
  
  // For demo purposes, return mock recommendations
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const bestDays = days.sort(() => 0.5 - Math.random()).slice(0, 3);
  
  const timeRanges = ['08:00-10:00', '12:00-14:00', '17:00-19:00', '20:00-22:00'];
  const bestTimeRanges = timeRanges.sort(() => 0.5 - Math.random()).slice(0, 2);
  
  return {
    bestDays,
    bestTimeRanges,
    confidence: Math.floor(Math.random() * 30) + 70, // 70-99% confidence
  };
}
