import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateRedditPost, 
  generateCommentResponse, 
  checkContentCompliance, 
  analyzeTrendingTopics, 
  generateAffiliateLinkDescription,
  AutonomousContentAgent,
  ContentPipeline
} from "./services/openai";
import { createRedditPost, postComment, getSubredditPosts, getPostComments, getSubredditInfo, updatePostStats, getApiUsageStatus, analyzeBestPostingTime } from "./services/reddit";
import { schedulePost, cancelScheduledPost, reschedulePost, getScheduledPosts, schedulePostsForCampaign, initializeScheduler } from "./services/scheduler";
import { searchRedditOpportunities, batchProcessKeywords, scoreAndQueueOpportunities } from "./services/serp-scraper";
import { triggerOpportunityProcessing, initializeOpportunityScheduler, triggerKeywordScan, triggerOpportunityScoring } from "./services/opportunity-scheduler";
import { initializeCategories, categorizeSubreddit, categorizeAllSubreddits, getSubredditsByCategory, findRelevantSubredditsForProgram } from "./services/subreddit-categorizer";
import { analyzeOpportunity, rankOpportunitiesForCampaign, findTemplatesForOpportunity } from "./services/opportunity-analyzer";
import { 
  getCrawlerOpportunities, 
  runCrawler,
  getCrawlerStatus,
  updateOpportunityStatus,
  convertToDbOpportunity,
  initializeCrawlerIntegration
} from "./services/crawler-integration";
import { z } from "zod";
import { 
  insertAffiliateProgramSchema, 
  insertCampaignSchema, 
  insertRedditPostSchema, 
  insertSubredditSchema, 
  insertContentTemplateSchema,
  insertKeywordSchema,
  insertRedditOpportunitySchema,
  insertContentQueueSchema
} from "@shared/schema";
import authRoutes from "./routes/index";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize the scheduler
  initializeScheduler().catch(err => {
    console.error("Error initializing scheduler:", err);
  });
  
  // Initialize the crawler integration
  initializeCrawlerIntegration().catch(err => {
    console.error("Error initializing crawler integration:", err);
  });

  // API Routes
  const apiRouter = express.Router();

  // Dashboard Stats
  apiRouter.get("/stats", async (req, res) => {
    try {
      const activeCampaigns = await storage.getActiveCampaignCount();
      const performance = await storage.getPerformanceSummary();
      
      res.json({
        activeCampaigns,
        monthlyClicks: performance.clicks,
        conversionRate: performance.conversionRate,
        revenue: performance.revenue,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });

  // Top Subreddits
  apiRouter.get("/top-subreddits", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const topSubreddits = await storage.getTopSubreddits(limit);
      
      res.json(topSubreddits);
    } catch (error) {
      console.error("Error fetching top subreddits:", error);
      res.status(500).json({ message: "Error fetching top subreddits" });
    }
  });

  // Recent Activity
  apiRouter.get("/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getActivities(limit);
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Error fetching activities" });
    }
  });

  // Compliance Status
  apiRouter.get("/compliance-status", async (req, res) => {
    try {
      const redditApiStatus = getApiUsageStatus();
      
      res.json({
        status: "compliant",
        apiRateLimit: {
          used: redditApiStatus.used,
          limit: redditApiStatus.limit,
          resetTime: redditApiStatus.resetTime,
          remainingPercent: redditApiStatus.remainingPercent,
        },
        postingFrequency: {
          status: "compliant",
          value: 45, // Percent of max allowed frequency
        },
        contentAuthenticity: {
          status: "compliant",
          value: 92, // Percent score
        },
      });
    } catch (error) {
      console.error("Error fetching compliance status:", error);
      res.status(500).json({ message: "Error fetching compliance status" });
    }
  });

  // Scheduled Posts
  apiRouter.get("/scheduled-posts", async (req, res) => {
    try {
      const scheduledPosts = await getScheduledPosts();
      
      res.json(scheduledPosts);
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
      res.status(500).json({ message: "Error fetching scheduled posts" });
    }
  });

  // Campaign Routes
  apiRouter.get("/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Error fetching campaigns" });
    }
  });

  apiRouter.get("/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error(`Error fetching campaign ${req.params.id}:`, error);
      res.status(500).json({ message: "Error fetching campaign" });
    }
  });

  apiRouter.post("/campaigns", async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
      
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(400).json({ message: "Invalid campaign data" });
    }
  });

  apiRouter.patch("/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCampaignSchema.partial().parse(req.body);
      
      const updatedCampaign = await storage.updateCampaign(id, validatedData);
      
      if (!updatedCampaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(updatedCampaign);
    } catch (error) {
      console.error(`Error updating campaign ${req.params.id}:`, error);
      res.status(400).json({ message: "Invalid campaign data" });
    }
  });

  apiRouter.delete("/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCampaign(id);
      
      if (!success) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting campaign ${req.params.id}:`, error);
      res.status(500).json({ message: "Error deleting campaign" });
    }
  });

  // Affiliate Program Routes
  apiRouter.get("/affiliate-programs", async (req, res) => {
    try {
      const programs = await storage.getAffiliatePrograms();
      res.json(programs);
    } catch (error) {
      console.error("Error fetching affiliate programs:", error);
      res.status(500).json({ message: "Error fetching affiliate programs" });
    }
  });

  apiRouter.get("/affiliate-programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const program = await storage.getAffiliateProgram(id);
      
      if (!program) {
        return res.status(404).json({ message: "Affiliate program not found" });
      }
      
      res.json(program);
    } catch (error) {
      console.error(`Error fetching affiliate program ${req.params.id}:`, error);
      res.status(500).json({ message: "Error fetching affiliate program" });
    }
  });

  apiRouter.post("/affiliate-programs", async (req, res) => {
    try {
      const validatedData = insertAffiliateProgramSchema.parse(req.body);
      const program = await storage.createAffiliateProgram(validatedData);
      
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating affiliate program:", error);
      res.status(400).json({ message: "Invalid affiliate program data" });
    }
  });

  apiRouter.patch("/affiliate-programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAffiliateProgramSchema.partial().parse(req.body);
      
      const updatedProgram = await storage.updateAffiliateProgram(id, validatedData);
      
      if (!updatedProgram) {
        return res.status(404).json({ message: "Affiliate program not found" });
      }
      
      res.json(updatedProgram);
    } catch (error) {
      console.error(`Error updating affiliate program ${req.params.id}:`, error);
      res.status(400).json({ message: "Invalid affiliate program data" });
    }
  });

  apiRouter.delete("/affiliate-programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAffiliateProgram(id);
      
      if (!success) {
        return res.status(404).json({ message: "Affiliate program not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting affiliate program ${req.params.id}:`, error);
      res.status(500).json({ message: "Error deleting affiliate program" });
    }
  });

  // Subreddit Routes
  apiRouter.get("/subreddits", async (req, res) => {
    try {
      const subreddits = await storage.getSubreddits();
      res.json(subreddits);
    } catch (error) {
      console.error("Error fetching subreddits:", error);
      res.status(500).json({ message: "Error fetching subreddits" });
    }
  });

  apiRouter.get("/subreddits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subreddit = await storage.getSubreddit(id);
      
      if (!subreddit) {
        return res.status(404).json({ message: "Subreddit not found" });
      }
      
      res.json(subreddit);
    } catch (error) {
      console.error(`Error fetching subreddit ${req.params.id}:`, error);
      res.status(500).json({ message: "Error fetching subreddit" });
    }
  });

  apiRouter.post("/subreddits", async (req, res) => {
    try {
      const validatedData = insertSubredditSchema.parse(req.body);
      const subreddit = await storage.createSubreddit(validatedData);
      
      res.status(201).json(subreddit);
    } catch (error) {
      console.error("Error creating subreddit:", error);
      res.status(400).json({ message: "Invalid subreddit data" });
    }
  });

  apiRouter.patch("/subreddits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSubredditSchema.partial().parse(req.body);
      
      const updatedSubreddit = await storage.updateSubreddit(id, validatedData);
      
      if (!updatedSubreddit) {
        return res.status(404).json({ message: "Subreddit not found" });
      }
      
      res.json(updatedSubreddit);
    } catch (error) {
      console.error(`Error updating subreddit ${req.params.id}:`, error);
      res.status(400).json({ message: "Invalid subreddit data" });
    }
  });

  // Content Generation Routes
  apiRouter.post("/generate-content", async (req, res) => {
    try {
      const { campaignId, subredditName, contentType, productFocus } = req.body;
      
      if (!campaignId || !subredditName || !contentType) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Get campaign details
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Get affiliate program details
      const affiliateProgram = await storage.getAffiliateProgram(campaign.affiliateProgramId);
      if (!affiliateProgram) {
        return res.status(404).json({ message: "Affiliate program not found" });
      }
      
      // Get subreddit details
      const subreddit = await storage.getSubredditByName(subredditName);
      const subredditRules = subreddit?.postingRules || "Be respectful. No spam or self-promotion.";
      
      // Generate content
      const generatedContent = await generateRedditPost(
        campaign.name,
        affiliateProgram.name,
        affiliateProgram.description || "",
        subredditName,
        subredditRules,
        contentType as "post" | "comment",
        productFocus
      );
      
      res.json(generatedContent);
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ message: "Error generating content" });
    }
  });

  apiRouter.post("/check-compliance", async (req, res) => {
    try {
      const { content, subredditName } = req.body;
      
      if (!content || !subredditName) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Get subreddit details
      const subreddit = await storage.getSubredditByName(subredditName);
      const subredditRules = subreddit?.postingRules || "Be respectful. No spam or self-promotion.";
      
      // Check content compliance
      const complianceResult = await checkContentCompliance(content, subredditRules);
      
      res.json(complianceResult);
    } catch (error) {
      console.error("Error checking content compliance:", error);
      res.status(500).json({ message: "Error checking content compliance" });
    }
  });
  
  // Autonomous Content Pipeline Routes
  const contentAgent = new AutonomousContentAgent();
  
  // Phase 1: Research & Discovery
  apiRouter.post("/content-pipeline/research", async (req, res) => {
    try {
      const { keyword, productName } = req.body;
      
      if (!keyword || !productName) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Run research phase
      const researchResults = await contentAgent.research(keyword, productName);
      
      // Log activity
      await storage.createActivity({
        type: "content",
        message: `Research completed for keyword: ${keyword}`,
        details: { keyword, productName, opportunityScore: researchResults.opportunityScore }
      });
      
      res.json(researchResults);
    } catch (error) {
      console.error("Error in research phase:", error);
      res.status(500).json({ message: "Error in research phase" });
    }
  });
  
  // Phase 2: Comment & Inject
  apiRouter.post("/content-pipeline/comment", async (req, res) => {
    try {
      const { researchData, affiliateInfo } = req.body;
      
      if (!researchData || !affiliateInfo) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Run comment phase
      const commentResults = await contentAgent.comment(researchData, affiliateInfo);
      
      // Log activity
      await storage.createActivity({
        type: "content",
        message: `Comment generated for post: ${commentResults.originalPostUrl.substring(0, 40)}...`,
        details: { 
          postUrl: commentResults.originalPostUrl,
          engagement: commentResults.expectedEngagement
        }
      });
      
      res.json(commentResults);
    } catch (error) {
      console.error("Error in comment phase:", error);
      res.status(500).json({ message: "Error in comment phase" });
    }
  });
  
  // Phase 3: Outranking Post Creation
  apiRouter.post("/content-pipeline/create-post", async (req, res) => {
    try {
      const { researchData, affiliateInfo } = req.body;
      
      if (!researchData || !affiliateInfo) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Run post creation phase
      const postResults = await contentAgent.createPost(researchData, affiliateInfo);
      
      // Log activity
      await storage.createActivity({
        type: "content",
        message: `Post created for subreddit r/${postResults.targetSubreddit}: ${postResults.title}`,
        details: { 
          title: postResults.title,
          subreddit: postResults.targetSubreddit,
          performance: postResults.expectedPerformance
        }
      });
      
      res.json(postResults);
    } catch (error) {
      console.error("Error in post creation phase:", error);
      res.status(500).json({ message: "Error in post creation phase" });
    }
  });
  
  // Phase 4: Keyword/Niche Looping
  apiRouter.post("/content-pipeline/loop-keywords", async (req, res) => {
    try {
      const { completedKeywords, productCategory } = req.body;
      
      if (!completedKeywords || !productCategory) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Run keyword loop phase
      const keywordResults = await contentAgent.loopKeywords(completedKeywords, productCategory);
      
      // Log activity
      await storage.createActivity({
        type: "content",
        message: `Keyword loop analysis completed for ${productCategory}`,
        details: { 
          processedKeywords: keywordResults.processedKeywords,
          recommendedKeywords: keywordResults.recommendedNextKeywords
        }
      });
      
      res.json(keywordResults);
    } catch (error) {
      console.error("Error in keyword loop phase:", error);
      res.status(500).json({ message: "Error in keyword loop phase" });
    }
  });
  
  // Complete Content Pipeline (all phases)
  apiRouter.post("/content-pipeline/complete", async (req, res) => {
    try {
      const { keyword, productName, affiliateInfo, productCategory } = req.body;
      
      if (!keyword || !productName || !affiliateInfo || !productCategory) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Run all phases in sequence
      const researchResults = await contentAgent.research(keyword, productName);
      const commentResults = await contentAgent.comment(researchResults, affiliateInfo);
      const postResults = await contentAgent.createPost(researchResults, affiliateInfo);
      
      // Add the current keyword to completed keywords
      const completedKeywords = [keyword];
      const keywordResults = await contentAgent.loopKeywords(completedKeywords, productCategory);
      
      // Log activity
      await storage.createActivity({
        type: "content",
        message: `Complete content pipeline executed for ${keyword}`,
        details: { 
          keyword,
          productName,
          opportunityScore: researchResults.opportunityScore
        }
      });
      
      // Return all results
      res.json({
        research: researchResults,
        comment: commentResults,
        post: postResults,
        keywords: keywordResults
      });
    } catch (error) {
      console.error("Error in complete content pipeline:", error);
      res.status(500).json({ message: "Error in complete content pipeline" });
    }
  });

  // Reddit Crawler Routes
  apiRouter.get("/crawler/status", async (req, res) => {
    try {
      const status = await getCrawlerStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting crawler status:", error);
      res.status(500).json({ message: "Error getting crawler status" });
    }
  });

  apiRouter.get("/crawler/opportunities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const opportunities = await getCrawlerOpportunities(limit);
      res.json(opportunities);
    } catch (error) {
      console.error("Error getting crawler opportunities:", error);
      res.status(500).json({ message: "Error getting crawler opportunities" });
    }
  });

  apiRouter.post("/crawler/run", async (req, res) => {
    try {
      const { force = false, subreddits = [] } = req.body;
      
      // Start the crawler in the background
      runCrawler(force, subreddits)
        .then(success => {
          console.log(`Crawler finished with status: ${success ? 'success' : 'failed'}`);
        })
        .catch(err => {
          console.error("Error in crawler background task:", err);
        });
      
      res.json({ message: "Crawler started in background" });
    } catch (error) {
      console.error("Error starting crawler:", error);
      res.status(500).json({ message: "Error starting crawler" });
    }
  });

  apiRouter.patch("/crawler/opportunity/:thread_id", async (req, res) => {
    try {
      const { thread_id } = req.params;
      const { status } = req.body;
      
      if (!thread_id || !status) {
        return res.status(400).json({ message: "Missing thread_id or status" });
      }
      
      const success = await updateOpportunityStatus(thread_id, status);
      
      if (!success) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      res.json({ message: "Opportunity status updated" });
    } catch (error) {
      console.error("Error updating opportunity status:", error);
      res.status(500).json({ message: "Error updating opportunity status" });
    }
  });

  apiRouter.post("/crawler/import", async (req, res) => {
    try {
      const { opportunity } = req.body;
      
      if (!opportunity) {
        return res.status(400).json({ message: "Missing opportunity data" });
      }
      
      // Convert the crawler opportunity to the DB schema
      const dbOpportunity = convertToDbOpportunity(opportunity);
      
      // Save to the database
      const savedOpportunity = await storage.createRedditOpportunity(dbOpportunity);
      
      res.status(201).json(savedOpportunity);
    } catch (error) {
      console.error("Error importing opportunity:", error);
      res.status(500).json({ message: "Error importing opportunity" });
    }
  });

  // Reddit Post Routes
  apiRouter.get("/reddit-posts", async (req, res) => {
    try {
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
      const status = req.query.status as string | undefined;
      
      let posts;
      if (campaignId) {
        posts = await storage.getRedditPostsByCampaign(campaignId);
      } else if (status) {
        posts = await storage.getRedditPostsByStatus(status);
      } else {
        posts = await storage.getRedditPosts();
      }
      
      res.json(posts);
    } catch (error) {
      console.error("Error fetching Reddit posts:", error);
      res.status(500).json({ message: "Error fetching Reddit posts" });
    }
  });

  apiRouter.get("/reddit-posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getRedditPost(id);
      
      if (!post) {
        return res.status(404).json({ message: "Reddit post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error(`Error fetching Reddit post ${req.params.id}:`, error);
      res.status(500).json({ message: "Error fetching Reddit post" });
    }
  });

  apiRouter.post("/reddit-posts", async (req, res) => {
    try {
      const validatedData = insertRedditPostSchema.parse(req.body);
      const post = await storage.createRedditPost(validatedData);
      
      // If there's a scheduled time, schedule the post
      if (validatedData.scheduledTime && validatedData.status === "scheduled") {
        await schedulePost(post.id, new Date(validatedData.scheduledTime));
      }
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating Reddit post:", error);
      res.status(400).json({ message: "Invalid Reddit post data" });
    }
  });

  apiRouter.patch("/reddit-posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRedditPostSchema.partial().parse(req.body);
      
      // Get the existing post
      const existingPost = await storage.getRedditPost(id);
      if (!existingPost) {
        return res.status(404).json({ message: "Reddit post not found" });
      }
      
      // Handle scheduling changes
      if (validatedData.scheduledTime && validatedData.status === "scheduled") {
        // Schedule or reschedule the post
        await reschedulePost(id, new Date(validatedData.scheduledTime));
      } else if (validatedData.status === "draft" && existingPost.status === "scheduled") {
        // Cancel scheduling if status changed to draft
        await cancelScheduledPost(id);
      }
      
      const updatedPost = await storage.updateRedditPost(id, validatedData);
      
      res.json(updatedPost);
    } catch (error) {
      console.error(`Error updating Reddit post ${req.params.id}:`, error);
      res.status(400).json({ message: "Invalid Reddit post data" });
    }
  });

  apiRouter.delete("/reddit-posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Cancel any scheduled job
      await cancelScheduledPost(id);
      
      const success = await storage.deleteRedditPost(id);
      
      if (!success) {
        return res.status(404).json({ message: "Reddit post not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting Reddit post ${req.params.id}:`, error);
      res.status(500).json({ message: "Error deleting Reddit post" });
    }
  });

  // Schedule an existing post
  apiRouter.post("/reddit-posts/:id/schedule", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { scheduledTime } = req.body;
      
      if (!scheduledTime) {
        return res.status(400).json({ message: "Missing scheduledTime" });
      }
      
      const success = await schedulePost(id, new Date(scheduledTime));
      
      if (!success) {
        return res.status(404).json({ message: "Reddit post not found or could not be scheduled" });
      }
      
      const updatedPost = await storage.getRedditPost(id);
      res.json(updatedPost);
    } catch (error) {
      console.error(`Error scheduling Reddit post ${req.params.id}:`, error);
      res.status(500).json({ message: "Error scheduling Reddit post" });
    }
  });

  // Cancel a scheduled post
  apiRouter.post("/reddit-posts/:id/cancel-schedule", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const success = await cancelScheduledPost(id);
      
      if (!success) {
        return res.status(404).json({ message: "Reddit post not found or not scheduled" });
      }
      
      const updatedPost = await storage.getRedditPost(id);
      res.json(updatedPost);
    } catch (error) {
      console.error(`Error cancelling scheduled Reddit post ${req.params.id}:`, error);
      res.status(500).json({ message: "Error cancelling scheduled Reddit post" });
    }
  });

  // Performance Metrics Routes
  apiRouter.get("/performance", async (req, res) => {
    try {
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
      
      let metrics;
      if (campaignId) {
        metrics = await storage.getMetricsByCampaign(campaignId);
      } else {
        // Get all metrics from the past 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        metrics = await storage.getMetricsByDateRange(startDate, endDate);
      }
      
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Error fetching performance metrics" });
    }
  });

  // Content Templates Routes
  apiRouter.get("/content-templates", async (req, res) => {
    try {
      const contentType = req.query.contentType as string | undefined;
      
      let templates;
      if (contentType) {
        templates = await storage.getContentTemplatesByType(contentType);
      } else {
        templates = await storage.getContentTemplates();
      }
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching content templates:", error);
      res.status(500).json({ message: "Error fetching content templates" });
    }
  });

  apiRouter.post("/content-templates", async (req, res) => {
    try {
      const validatedData = insertContentTemplateSchema.parse(req.body);
      const template = await storage.createContentTemplate(validatedData);
      
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating content template:", error);
      res.status(400).json({ message: "Invalid content template data" });
    }
  });

  // Reddit API Access Routes
  apiRouter.get("/subreddit-info/:name", async (req, res) => {
    try {
      const name = req.params.name;
      
      // First check our database
      const subredditFromDb = await storage.getSubredditByName(name);
      
      if (subredditFromDb) {
        return res.json(subredditFromDb);
      }
      
      // If not in database, try to get from Reddit API
      const subredditInfo = await getSubredditInfo(name);
      
      res.json(subredditInfo);
    } catch (error) {
      console.error(`Error fetching subreddit info for ${req.params.name}:`, error);
      res.status(500).json({ message: "Error fetching subreddit info" });
    }
  });

  apiRouter.get("/best-posting-time/:subreddit", async (req, res) => {
    try {
      const subreddit = req.params.subreddit;
      
      const bestTimeInfo = await analyzeBestPostingTime(subreddit);
      
      res.json(bestTimeInfo);
    } catch (error) {
      console.error(`Error analyzing best posting time for ${req.params.subreddit}:`, error);
      res.status(500).json({ message: "Error analyzing best posting time" });
    }
  });

  // Keywords Routes
  apiRouter.get("/keywords", async (req, res) => {
    try {
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
      const affiliateProgramId = req.query.affiliateProgramId ? parseInt(req.query.affiliateProgramId as string) : undefined;
      
      let keywords;
      if (campaignId) {
        keywords = await storage.getKeywordsByCampaign(campaignId);
      } else if (affiliateProgramId) {
        keywords = await storage.getKeywordsByAffiliateProgram(affiliateProgramId);
      } else {
        keywords = await storage.getKeywords();
      }
      
      res.json(keywords);
    } catch (error) {
      console.error("Error fetching keywords:", error);
      res.status(500).json({ message: "Error fetching keywords" });
    }
  });

  apiRouter.get("/keywords/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const keyword = await storage.getKeyword(id);
      
      if (!keyword) {
        return res.status(404).json({ message: "Keyword not found" });
      }
      
      res.json(keyword);
    } catch (error) {
      console.error(`Error fetching keyword ${req.params.id}:`, error);
      res.status(500).json({ message: "Error fetching keyword" });
    }
  });

  apiRouter.post("/keywords", async (req, res) => {
    try {
      const validatedData = insertKeywordSchema.parse(req.body);
      const keyword = await storage.createKeyword(validatedData);
      
      res.status(201).json(keyword);
    } catch (error) {
      console.error("Error creating keyword:", error);
      res.status(400).json({ message: "Invalid keyword data" });
    }
  });

  apiRouter.patch("/keywords/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertKeywordSchema.partial().parse(req.body);
      
      const updatedKeyword = await storage.updateKeyword(id, validatedData);
      
      if (!updatedKeyword) {
        return res.status(404).json({ message: "Keyword not found" });
      }
      
      res.json(updatedKeyword);
    } catch (error) {
      console.error(`Error updating keyword ${req.params.id}:`, error);
      res.status(400).json({ message: "Invalid keyword data" });
    }
  });

  apiRouter.delete("/keywords/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteKeyword(id);
      
      if (!success) {
        return res.status(404).json({ message: "Keyword not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting keyword ${req.params.id}:`, error);
      res.status(500).json({ message: "Error deleting keyword" });
    }
  });

  // Opportunities Routes
  apiRouter.get("/opportunities", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      
      let opportunities;
      if (status) {
        opportunities = await storage.getRedditOpportunitiesByStatus(status);
      } else {
        opportunities = await storage.getRedditOpportunities();
      }
      
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ message: "Error fetching opportunities" });
    }
  });

  apiRouter.get("/opportunities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const opportunity = await storage.getRedditOpportunity(id);
      
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      res.json(opportunity);
    } catch (error) {
      console.error(`Error fetching opportunity ${req.params.id}:`, error);
      res.status(500).json({ message: "Error fetching opportunity" });
    }
  });

  apiRouter.patch("/opportunities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRedditOpportunitySchema.partial().parse(req.body);
      
      const updatedOpportunity = await storage.updateRedditOpportunity(id, validatedData);
      
      if (!updatedOpportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      res.json(updatedOpportunity);
    } catch (error) {
      console.error(`Error updating opportunity ${req.params.id}:`, error);
      res.status(400).json({ message: "Invalid opportunity data" });
    }
  });

  apiRouter.post("/opportunities/scan", async (req, res) => {
    try {
      const keywordLimit = req.body.keywordLimit || 10;
      
      // Phase 1: Process keywords and find opportunities
      const processedKeywords = await triggerKeywordScan(keywordLimit);
      
      // Phase 2: Score opportunities and queue them
      const queuedCount = await triggerOpportunityScoring();
      
      // Log activity
      await storage.createActivity({
        type: "system",
        message: `Opportunity scan completed: ${processedKeywords} keywords processed, ${queuedCount} opportunities queued`,
        details: { processedKeywords, queuedCount }
      });
      
      res.json({ 
        success: true, 
        processedKeywords, 
        queuedCount 
      });
    } catch (error) {
      console.error("Error scanning for opportunities:", error);
      res.status(500).json({ message: "Error scanning for opportunities" });
    }
  });

  apiRouter.post("/opportunities/process", async (req, res) => {
    try {
      // Process opportunities in the queue and generate content
      await triggerOpportunityProcessing();
      
      // Log activity
      await storage.createActivity({
        type: "system",
        message: "Opportunity processing triggered",
        details: { timestamp: new Date() }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing opportunities:", error);
      res.status(500).json({ message: "Error processing opportunities" });
    }
  });

  // Content Queue Routes
  apiRouter.get("/content-queue", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
      
      let queueItems;
      if (status) {
        queueItems = await storage.getContentQueueItemsByStatus(status);
      } else if (campaignId) {
        queueItems = await storage.getContentQueueItemsByCampaign(campaignId);
      } else {
        queueItems = await storage.getContentQueueItems();
      }
      
      res.json(queueItems);
    } catch (error) {
      console.error("Error fetching content queue:", error);
      res.status(500).json({ message: "Error fetching content queue" });
    }
  });

  apiRouter.get("/content-queue/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const queueItem = await storage.getContentQueueItem(id);
      
      if (!queueItem) {
        return res.status(404).json({ message: "Content queue item not found" });
      }
      
      res.json(queueItem);
    } catch (error) {
      console.error(`Error fetching content queue item ${req.params.id}:`, error);
      res.status(500).json({ message: "Error fetching content queue item" });
    }
  });

  apiRouter.post("/content-queue", async (req, res) => {
    try {
      const validatedData = insertContentQueueSchema.parse(req.body);
      const queueItem = await storage.createContentQueueItem(validatedData);
      
      res.status(201).json(queueItem);
    } catch (error) {
      console.error("Error creating content queue item:", error);
      res.status(400).json({ message: "Invalid content queue data" });
    }
  });

  apiRouter.patch("/content-queue/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContentQueueSchema.partial().parse(req.body);
      
      const updatedQueueItem = await storage.updateContentQueueItem(id, validatedData);
      
      if (!updatedQueueItem) {
        return res.status(404).json({ message: "Content queue item not found" });
      }
      
      res.json(updatedQueueItem);
    } catch (error) {
      console.error(`Error updating content queue item ${req.params.id}:`, error);
      res.status(400).json({ message: "Invalid content queue data" });
    }
  });

  apiRouter.delete("/content-queue/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContentQueueItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Content queue item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting content queue item ${req.params.id}:`, error);
      res.status(500).json({ message: "Error deleting content queue item" });
    }
  });

  // Advanced Opportunity Analysis Routes
  apiRouter.get("/categories", async (req, res) => {
    try {
      await initializeCategories();
      const categories = await storage.getSubredditCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  apiRouter.get("/opportunities/top", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const opportunities = await storage.getTopOpportunities(limit);
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching top opportunities:", error);
      res.status(500).json({ message: "Error fetching top opportunities" });
    }
  });

  apiRouter.get("/opportunities/analyze/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const opportunity = await storage.getRedditOpportunity(id);
      
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      // Get affiliate program (optional)
      let affiliateProgram = undefined;
      if (req.query.affiliateProgramId) {
        const programId = parseInt(req.query.affiliateProgramId as string);
        affiliateProgram = await storage.getAffiliateProgram(programId);
      } else if ('affiliateProgramId' in opportunity && opportunity.affiliateProgramId) {
        affiliateProgram = await storage.getAffiliateProgram(opportunity.affiliateProgramId as number);
      }
      
      if (!affiliateProgram) {
        return res.status(400).json({ message: "Affiliate program is required for analysis" });
      }
      
      // Analyze the opportunity
      const analysis = await analyzeOpportunity(opportunity, affiliateProgram);
      
      res.json({
        opportunity,
        analysis,
        affiliateProgram
      });
    } catch (error) {
      console.error(`Error analyzing opportunity ${req.params.id}:`, error);
      res.status(500).json({ message: "Error analyzing opportunity" });
    }
  });

  apiRouter.get("/opportunities/rank/:campaignId", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const rankedOpportunities = await rankOpportunitiesForCampaign(campaignId, limit);
      
      res.json(rankedOpportunities);
    } catch (error) {
      console.error(`Error ranking opportunities for campaign ${req.params.campaignId}:`, error);
      res.status(500).json({ message: "Error ranking opportunities" });
    }
  });

  apiRouter.get("/subreddits/categorize/:id", async (req, res) => {
    try {
      const subredditId = parseInt(req.params.id);
      const categories = await categorizeSubreddit(subredditId);
      
      res.json(categories);
    } catch (error) {
      console.error(`Error categorizing subreddit ${req.params.id}:`, error);
      res.status(500).json({ message: "Error categorizing subreddit" });
    }
  });

  apiRouter.get("/subreddits/by-category/:categoryName", async (req, res) => {
    try {
      const categoryName = req.params.categoryName;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const subreddits = await getSubredditsByCategory(categoryName, limit);
      
      res.json(subreddits);
    } catch (error) {
      console.error(`Error fetching subreddits for category ${req.params.categoryName}:`, error);
      res.status(500).json({ message: "Error fetching subreddits by category" });
    }
  });

  apiRouter.get("/affiliate-programs/:id/relevant-subreddits", async (req, res) => {
    try {
      const programId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const relevantSubreddits = await findRelevantSubredditsForProgram(programId, limit);
      
      res.json(relevantSubreddits);
    } catch (error) {
      console.error(`Error finding relevant subreddits for program ${req.params.id}:`, error);
      res.status(500).json({ message: "Error finding relevant subreddits" });
    }
  });

  // Initialize Opportunity Scheduler
  initializeOpportunityScheduler().catch(err => {
    console.error("Error initializing opportunity scheduler:", err);
  });

  // Initialize subreddit categories
  initializeCategories().catch(err => {
    console.error("Error initializing subreddit categories:", err);
  });
  
  // Initialize Reddit opportunity fetcher
  import('./services/reddit-fetcher').then(({ initializeOpportunityFetcher }) => {
    initializeOpportunityFetcher();
    console.log("Reddit opportunity fetcher initialized");
  }).catch(err => {
    console.error("Error initializing Reddit opportunity fetcher:", err);
  });

  // Reddit real-time data fetching endpoint
  apiRouter.post("/fetch-opportunities", async (req, res) => {
    try {
      const { subreddits, mode, limit } = req.body;
      const options = {
        subreddits: subreddits || [],
        mode: (mode as 'new' | 'hot' | 'top' | 'rising') || 'hot',
        limit: limit ? parseInt(limit as string) : 25
      };
      
      console.log(`Fetching opportunities with options:`, options);
      
      // Import the fetchOpportunities function
      const { fetchOpportunities } = await import('./services/reddit-fetcher');
      
      // Fetch opportunities
      const opportunities = await fetchOpportunities(
        options.subreddits, 
        options.mode, 
        options.limit
      );
      
      console.log(`Fetched ${opportunities.length} opportunities`);
      
      res.json({
        success: true,
        count: opportunities.length,
        opportunities
      });
    } catch (error: any) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error fetching opportunities",
        error: error.message || String(error)
      });
    }
  });
  
  // Endpoint to manually trigger opportunity analysis
  apiRouter.post("/analyze-opportunities", async (req, res) => {
    try {
      // Import the necessary functions
      const { rankOpportunitiesForCampaign } = await import('./services/opportunity-analyzer');
      
      // Get campaign ID from request or use default
      const campaignId = req.body.campaignId ? parseInt(req.body.campaignId) : null;
      const limit = req.body.limit ? parseInt(req.body.limit) : 10;
      
      if (!campaignId) {
        return res.status(400).json({ 
          success: false, 
          message: "Campaign ID is required" 
        });
      }
      
      // Rank opportunities for the campaign
      const rankedOpportunities = await rankOpportunitiesForCampaign(campaignId, limit);
      
      res.json({
        success: true,
        count: rankedOpportunities.length,
        opportunities: rankedOpportunities
      });
    } catch (error: any) {
      console.error("Error analyzing opportunities:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error analyzing opportunities",
        error: error.message || String(error)
      });
    }
  });

  // Register the API router
  // Mount auth routes
  // Only use Reddit auth routes if credentials are configured
  if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
    app.use(authRoutes);
    console.log('Reddit authentication routes enabled');
  } else {
    console.log('Reddit authentication routes disabled - missing API credentials');
  }
  
  // Reddit Crawler API Routes
  apiRouter.get("/crawler/status", async (req, res) => {
    try {
      const status = await getCrawlerStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting crawler status:", error);
      res.status(500).json({ message: "Error getting crawler status" });
    }
  });

  apiRouter.get("/crawler/opportunities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const opportunities = await getCrawlerOpportunities(limit);
      res.json(opportunities);
    } catch (error) {
      console.error("Error getting crawler opportunities:", error);
      res.status(500).json({ message: "Error getting crawler opportunities" });
    }
  });

  apiRouter.post("/crawler/run", async (req, res) => {
    try {
      const { force, subreddits } = req.body;
      const success = await runCrawler(!!force, subreddits);
      res.json({ success });
    } catch (error) {
      console.error("Error running crawler:", error);
      res.status(500).json({ message: "Error running crawler" });
    }
  });

  apiRouter.patch("/crawler/opportunity/:threadId", async (req, res) => {
    try {
      const { threadId } = req.params;
      const { status } = req.body;
      
      if (!['new', 'queued', 'processed', 'ignored'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const success = await updateOpportunityStatus(threadId, status);
      if (!success) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      res.json({ success });
    } catch (error) {
      console.error("Error updating opportunity status:", error);
      res.status(500).json({ message: "Error updating opportunity status" });
    }
  });

  apiRouter.post("/crawler/import", async (req, res) => {
    try {
      const { opportunity } = req.body;
      
      if (!opportunity) {
        return res.status(400).json({ message: "Opportunity data is required" });
      }
      
      const dbOpportunity = convertToDbOpportunity(opportunity);
      
      // Check if the opportunity already exists
      const existingOpportunity = await storage.getRedditOpportunityByUrl(dbOpportunity.url || dbOpportunity.redditPostUrl);
      if (existingOpportunity) {
        return res.json(existingOpportunity);
      }
      
      // Create new opportunity in the database
      const savedOpportunity = await storage.createRedditOpportunity(dbOpportunity);
      
      // Update the status in the crawler data
      await updateOpportunityStatus(opportunity.thread_id, 'processed');
      
      res.json(savedOpportunity);
    } catch (error) {
      console.error("Error importing opportunity:", error);
      res.status(500).json({ message: "Error importing opportunity" });
    }
  });

  // Mount other API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
