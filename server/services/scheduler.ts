import { storage } from '../storage';
import { createRedditPost, updatePostStats } from './reddit';
import schedule from 'node-schedule';

interface ScheduledJob {
  id: number;
  job: schedule.Job;
}

// Active scheduled jobs
const scheduledJobs: Map<number, schedule.Job> = new Map();

// Initialize the scheduler
export async function initializeScheduler(): Promise<void> {
  console.log('Initializing post scheduler...');
  
  // Schedule the regular check for pending posts
  schedule.scheduleJob('*/5 * * * *', async () => {
    await checkAndExecutePendingPosts();
  });
  
  // Schedule daily metrics update
  schedule.scheduleJob('0 * * * *', async () => {
    await updateAllPostStats();
  });
  
  // Schedule initial check for any missed posts (in case of server restart)
  setTimeout(async () => {
    await checkAndExecutePendingPosts();
  }, 5000);
  
  console.log('Post scheduler initialized');
}

// Check for pending posts that need to be published
async function checkAndExecutePendingPosts(): Promise<void> {
  try {
    // Get all posts that are scheduled and due to be posted
    const pendingPosts = await storage.getPendingScheduledPosts();
    
    if (pendingPosts.length > 0) {
      console.log(`Found ${pendingPosts.length} pending posts to publish`);
      
      for (const post of pendingPosts) {
        // Post to Reddit
        const result = await createRedditPost(
          post.subredditName,
          post.title,
          post.content,
          post.id
        );
        
        if (result.success) {
          console.log(`Successfully posted to Reddit: ${post.title}`);
          
          // Update the post with the Reddit post ID and status
          await storage.updateRedditPost(post.id, {
            status: 'posted',
            redditPostId: result.redditPostId,
            postedTime: new Date(),
          });
          
          // Log the activity
          await storage.createActivity({
            campaignId: post.campaignId,
            type: 'post_published',
            message: `Post "${post.title}" was published to ${post.subredditName}`,
            details: {
              postId: post.id,
              subreddit: post.subredditName,
              redditPostId: result.redditPostId,
            },
          });
        } else {
          console.error(`Failed to post to Reddit: ${result.error}`);
          
          // Mark the post as failed
          await storage.updateRedditPost(post.id, {
            status: 'failed',
          });
          
          // Log the activity
          await storage.createActivity({
            campaignId: post.campaignId,
            type: 'post_failed',
            message: `Failed to publish post "${post.title}" to ${post.subredditName}`,
            details: {
              postId: post.id,
              subreddit: post.subredditName,
              error: result.error,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in checkAndExecutePendingPosts:', error);
  }
}

// Schedule a specific post
export async function schedulePost(postId: number, scheduledTime: Date): Promise<boolean> {
  try {
    // Get the post
    const post = await storage.getRedditPost(postId);
    if (!post) {
      console.error(`Post with ID ${postId} not found`);
      return false;
    }
    
    // Cancel any existing job for this post
    if (scheduledJobs.has(postId)) {
      scheduledJobs.get(postId)?.cancel();
      scheduledJobs.delete(postId);
    }
    
    // Schedule the new job
    const job = schedule.scheduleJob(scheduledTime, async () => {
      try {
        // Post to Reddit
        const result = await createRedditPost(
          post.subredditName,
          post.title,
          post.content,
          post.id
        );
        
        if (result.success) {
          console.log(`Successfully posted to Reddit via scheduled job: ${post.title}`);
          
          // Update the post with the Reddit post ID and status
          await storage.updateRedditPost(post.id, {
            status: 'posted',
            redditPostId: result.redditPostId,
            postedTime: new Date(),
          });
          
          // Log the activity
          await storage.createActivity({
            campaignId: post.campaignId,
            type: 'post_published',
            message: `Scheduled post "${post.title}" was published to ${post.subredditName}`,
            details: {
              postId: post.id,
              subreddit: post.subredditName,
              redditPostId: result.redditPostId,
            },
          });
        } else {
          console.error(`Failed to post to Reddit via scheduled job: ${result.error}`);
          
          // Mark the post as failed
          await storage.updateRedditPost(post.id, {
            status: 'failed',
          });
          
          // Log the activity
          await storage.createActivity({
            campaignId: post.campaignId,
            type: 'post_failed',
            message: `Failed to publish scheduled post "${post.title}" to ${post.subredditName}`,
            details: {
              postId: post.id,
              subreddit: post.subredditName,
              error: result.error,
            },
          });
        }
      } catch (error) {
        console.error(`Error executing scheduled post ${postId}:`, error);
      } finally {
        // Remove the job from the map
        scheduledJobs.delete(postId);
      }
    });
    
    // Store the job
    scheduledJobs.set(postId, job);
    
    // Update the post's scheduled time in the database
    await storage.updateRedditPost(postId, {
      scheduledTime,
    });
    
    // Log the activity
    await storage.createActivity({
      campaignId: post.campaignId,
      type: 'post_scheduled',
      message: `Post "${post.title}" scheduled for ${scheduledTime.toLocaleString()} to ${post.subredditName}`,
      details: {
        postId: post.id,
        subreddit: post.subredditName,
        scheduledTime: scheduledTime.toISOString(),
      },
    });
    
    return true;
  } catch (error) {
    console.error(`Error scheduling post ${postId}:`, error);
    return false;
  }
}

// Cancel a scheduled post
export async function cancelScheduledPost(postId: number): Promise<boolean> {
  try {
    // Check if the post exists
    const post = await storage.getRedditPost(postId);
    if (!post) {
      console.error(`Post with ID ${postId} not found`);
      return false;
    }
    
    // Cancel the job if it exists
    if (scheduledJobs.has(postId)) {
      scheduledJobs.get(postId)?.cancel();
      scheduledJobs.delete(postId);
      
      // Update the post status
      await storage.updateRedditPost(postId, {
        status: 'draft',
        scheduledTime: null,
      });
      
      // Log the activity
      await storage.createActivity({
        campaignId: post.campaignId,
        type: 'post_unscheduled',
        message: `Scheduled post "${post.title}" was cancelled`,
        details: {
          postId: post.id,
          subreddit: post.subredditName,
        },
      });
      
      return true;
    } else {
      console.warn(`No scheduled job found for post ${postId}`);
      return false;
    }
  } catch (error) {
    console.error(`Error cancelling scheduled post ${postId}:`, error);
    return false;
  }
}

// Reschedule a post
export async function reschedulePost(postId: number, newScheduledTime: Date): Promise<boolean> {
  try {
    // Cancel the existing schedule
    if (scheduledJobs.has(postId)) {
      scheduledJobs.get(postId)?.cancel();
      scheduledJobs.delete(postId);
    }
    
    // Schedule with the new time
    return await schedulePost(postId, newScheduledTime);
  } catch (error) {
    console.error(`Error rescheduling post ${postId}:`, error);
    return false;
  }
}

// Update metrics for all posted content
async function updateAllPostStats(): Promise<void> {
  try {
    // Get all posts that have been posted
    const posts = await storage.getRedditPostsByStatus('posted');
    
    for (const post of posts) {
      if (post.redditPostId) {
        try {
          // Update the stats
          const stats = await updatePostStats(post.id, post.redditPostId);
          
          console.log(`Updated stats for post ${post.id}: ${stats.upvotes} upvotes, ${stats.commentCount} comments`);
        } catch (error) {
          console.error(`Error updating stats for post ${post.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error in updateAllPostStats:', error);
  }
}

// Get all currently scheduled posts
export async function getScheduledPosts(): Promise<Array<{
  id: number;
  title: string;
  scheduledTime: Date;
  subreddit: string;
  campaignId: number;
}>> {
  try {
    const scheduledPosts = await storage.getRedditPostsByStatus('scheduled');
    
    return scheduledPosts
      .filter(post => post.scheduledTime)
      .map(post => ({
        id: post.id,
        title: post.title,
        scheduledTime: post.scheduledTime!,
        subreddit: post.subredditName,
        campaignId: post.campaignId,
      }))
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  } catch (error) {
    console.error('Error in getScheduledPosts:', error);
    return [];
  }
}

// Schedule posts for a campaign based on campaign settings
export async function schedulePostsForCampaign(
  campaignId: number,
  posts: Array<{
    id: number;
    subreddit: string;
  }>,
  startDate: Date,
  frequency: string,
  daysOfWeek: number[],
  timeRanges: string[]
): Promise<number> {
  try {
    let scheduledCount = 0;
    
    // For each post, calculate a scheduled time based on campaign settings
    for (const post of posts) {
      // Get a time within the specified ranges
      const scheduledTime = calculateNextPostTime(
        startDate,
        frequency,
        daysOfWeek,
        timeRanges,
        scheduledCount
      );
      
      if (scheduledTime) {
        // Schedule the post
        const success = await schedulePost(post.id, scheduledTime);
        
        if (success) {
          scheduledCount++;
        }
      }
    }
    
    return scheduledCount;
  } catch (error) {
    console.error(`Error scheduling posts for campaign ${campaignId}:`, error);
    return 0;
  }
}

// Calculate the next posting time based on campaign schedule settings
function calculateNextPostTime(
  startDate: Date,
  frequency: string,
  daysOfWeek: number[],
  timeRanges: string[],
  offset: number = 0
): Date | null {
  try {
    const now = new Date();
    let postDate = new Date(startDate);
    
    // Ensure we're not scheduling in the past
    if (postDate < now) {
      postDate = now;
    }
    
    if (frequency === 'daily') {
      // Add offset days
      postDate.setDate(postDate.getDate() + offset);
      
      // Set time from one of the time ranges
      const timeRange = timeRanges[offset % timeRanges.length];
      const [startTime] = timeRange.split('-');
      const [hours, minutes] = startTime.split(':').map(Number);
      
      postDate.setHours(hours, minutes, 0, 0);
      
      return postDate;
    } else if (frequency === 'weekly') {
      // Find the next available day based on daysOfWeek
      // JS: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const currentDay = postDate.getDay();
      const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
      
      // Find the next day that's allowed
      let nextDay = sortedDays.find(day => day > currentDay);
      
      // If no days are greater than current day, go to next week
      if (!nextDay) {
        nextDay = sortedDays[0];
        postDate.setDate(postDate.getDate() + (7 - currentDay + nextDay));
      } else {
        postDate.setDate(postDate.getDate() + (nextDay - currentDay));
      }
      
      // Add offset weeks
      postDate.setDate(postDate.getDate() + (Math.floor(offset / timeRanges.length) * 7));
      
      // Set time from one of the time ranges
      const timeRange = timeRanges[offset % timeRanges.length];
      const [startTime] = timeRange.split('-');
      const [hours, minutes] = startTime.split(':').map(Number);
      
      postDate.setHours(hours, minutes, 0, 0);
      
      return postDate;
    } else if (frequency === 'custom') {
      // For custom, we'll just distribute the posts evenly across the specified days and times
      const totalSlots = daysOfWeek.length * timeRanges.length;
      const slotIndex = offset % totalSlots;
      
      const dayIndex = Math.floor(slotIndex / timeRanges.length);
      const timeIndex = slotIndex % timeRanges.length;
      
      const targetDay = daysOfWeek[dayIndex];
      const timeRange = timeRanges[timeIndex];
      
      // Calculate days to add to reach the target day
      const currentDay = postDate.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd < 0) daysToAdd += 7;
      
      // Add weeks based on offset
      daysToAdd += Math.floor(offset / totalSlots) * 7;
      
      postDate.setDate(postDate.getDate() + daysToAdd);
      
      // Set time from the selected time range
      const [startTime] = timeRange.split('-');
      const [hours, minutes] = startTime.split(':').map(Number);
      
      postDate.setHours(hours, minutes, 0, 0);
      
      return postDate;
    }
    
    return null;
  } catch (error) {
    console.error('Error in calculateNextPostTime:', error);
    return null;
  }
}
