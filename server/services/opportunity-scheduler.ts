import schedule from 'node-schedule';
import { batchProcessKeywords, scoreAndQueueOpportunities } from './serp-scraper';
import { storage } from '../storage';

// Track scheduled jobs
let jobs: { [key: string]: schedule.Job } = {};

/**
 * Process new opportunities and create content for them
 */
async function processQueuedOpportunities() {
  try {
    console.log('Processing queued opportunities...');
    
    // Get queued opportunities
    const opportunities = await storage.getRedditOpportunitiesByStatus('queued');
    
    if (opportunities.length === 0) {
      console.log('No queued opportunities to process');
      return;
    }
    
    console.log(`Found ${opportunities.length} queued opportunities`);
    
    for (const opportunity of opportunities) {
      // Get campaigns that target this subreddit
      const campaigns = await storage.getCampaigns();
      const matchingCampaigns = campaigns.filter(campaign => 
        campaign.status === 'active' &&
        campaign.targetSubreddits &&
        campaign.targetSubreddits.includes(`r/${opportunity.subreddit}`)
      );
      
      if (matchingCampaigns.length === 0) {
        console.log(`No active campaigns targeting r/${opportunity.subreddit}, skipping opportunity`);
        
        // Mark as rejected
        await storage.updateRedditOpportunity(opportunity.id, {
          status: 'rejected'
        });
        
        continue;
      }
      
      // Use the first matching campaign
      const campaign = matchingCampaigns[0];
      
      // Determine the scheduled time based on campaign settings
      const scheduledFor = calculateScheduleTime(campaign);
      
      // Create content queue item
      await storage.createContentQueueItem({
        opportunityId: opportunity.id,
        campaignId: campaign.id,
        type: opportunity.actionType || 'comment', // Default to comment if not specified
        subreddit: opportunity.subreddit,
        targetUrl: opportunity.redditPostUrl,
        content: `Auto-generated content for ${opportunity.title} will be created by AI`, // Placeholder
        scheduledFor,
        status: 'scheduled'
      });
      
      // Mark opportunity as processed
      await storage.updateRedditOpportunity(opportunity.id, {
        status: 'processed',
        dateProcessed: new Date()
      });
      
      // Log activity
      await storage.createActivity({
        campaignId: campaign.id,
        type: 'opportunity_processed',
        message: `Opportunity for "${opportunity.keyword}" in r/${opportunity.subreddit} queued for content generation`,
        details: {
          opportunityId: opportunity.id,
          subreddit: opportunity.subreddit,
          actionType: opportunity.actionType,
          scheduledFor
        }
      });
      
      console.log(`Processed opportunity ${opportunity.id} for campaign ${campaign.id}`);
    }
  } catch (error) {
    console.error('Error processing queued opportunities:', error);
  }
}

/**
 * Calculate a schedule time based on campaign settings
 */
function calculateScheduleTime(campaign: any): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Set a default time (e.g., 2pm tomorrow)
  tomorrow.setHours(14, 0, 0, 0);
  
  // If campaign has specific schedule settings, use those
  if (campaign.schedule) {
    // Extract schedule settings (simplified)
    const schedule = campaign.schedule;
    
    if (schedule.timeRanges && schedule.timeRanges.length > 0) {
      // Use the first time range
      const timeRange = schedule.timeRanges[0];
      const startTime = timeRange.split('-')[0]; // format: "HH:MM"
      
      const [hours, minutes] = startTime.split(':').map(Number);
      tomorrow.setHours(hours, minutes, 0, 0);
    }
  }
  
  return tomorrow;
}

/**
 * Initialize opportunity processing scheduler
 */
export async function initializeOpportunityScheduler(): Promise<void> {
  console.log('Initializing opportunity scheduler...');
  
  // Schedule daily keyword scanning (3:00 AM)
  jobs.keywordScan = schedule.scheduleJob('0 3 * * *', async function() {
    console.log('Starting scheduled keyword scan...');
    const count = await batchProcessKeywords(20);
    console.log(`Keyword scan complete. Found ${count} new opportunities.`);
    
    // Run scoring and queuing after scanning
    if (count > 0) {
      const queuedCount = await scoreAndQueueOpportunities();
      console.log(`Queued ${queuedCount} opportunities for processing.`);
    }
  });
  
  // Schedule daily opportunity processing (4:00 AM)
  jobs.opportunityProcessing = schedule.scheduleJob('0 4 * * *', async function() {
    console.log('Starting scheduled opportunity processing...');
    await processQueuedOpportunities();
    console.log('Opportunity processing complete.');
  });
  
  console.log('Opportunity scheduler initialized');
}

/**
 * Manually trigger a keyword scan
 */
export async function triggerKeywordScan(keywordLimit: number = 10): Promise<number> {
  console.log(`Manually triggering keyword scan for up to ${keywordLimit} keywords...`);
  const count = await batchProcessKeywords(keywordLimit);
  console.log(`Manual keyword scan complete. Found ${count} new opportunities.`);
  return count;
}

/**
 * Manually trigger opportunity scoring and queuing
 */
export async function triggerOpportunityScoring(): Promise<number> {
  console.log('Manually triggering opportunity scoring and queuing...');
  const count = await scoreAndQueueOpportunities();
  console.log(`Manual opportunity scoring complete. Queued ${count} opportunities.`);
  return count;
}

/**
 * Manually trigger opportunity processing
 */
export async function triggerOpportunityProcessing(): Promise<void> {
  console.log('Manually triggering opportunity processing...');
  await processQueuedOpportunities();
  console.log('Manual opportunity processing complete.');
}