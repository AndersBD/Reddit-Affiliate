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
import { z } from "zod";
import { insertAffiliateProgramSchema, insertCampaignSchema, insertRedditPostSchema, insertSubredditSchema, insertContentTemplateSchema } from "@shared/schema";
import authRoutes from "./routes/index";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize the scheduler
  initializeScheduler().catch(err => {
    console.error("Error initializing scheduler:", err);
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

  // Register the API router
  // Mount auth routes
  app.use(authRoutes);
  
  // Mount other API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
