import {
  type AffiliateProgram, type InsertAffiliateProgram,
  type Subreddit, type InsertSubreddit,
  type Campaign, type InsertCampaign,
  type RedditPost, type InsertRedditPost,
  type PerformanceMetric, type InsertPerformanceMetric,
  type Activity, type InsertActivity,
  type ContentTemplate, type InsertContentTemplate,
  type User, type InsertUser,
  type Keyword, type InsertKeyword,
  type RedditOpportunity, type InsertRedditOpportunity,
  type ContentQueueItem, type InsertContentQueueItem
} from "@shared/schema";

import { query, toCamelCase, toSnakeCase, initializeDatabase } from "./db";

export interface IStorage {
  // Affiliate Programs
  getAffiliatePrograms(): Promise<AffiliateProgram[]>;
  getAffiliateProgram(id: number): Promise<AffiliateProgram | undefined>;
  createAffiliateProgram(program: InsertAffiliateProgram): Promise<AffiliateProgram>;
  updateAffiliateProgram(id: number, program: Partial<InsertAffiliateProgram>): Promise<AffiliateProgram | undefined>;
  deleteAffiliateProgram(id: number): Promise<boolean>;

  // Subreddits
  getSubreddits(): Promise<Subreddit[]>;
  getSubreddit(id: number): Promise<Subreddit | undefined>;
  getSubredditByName(name: string): Promise<Subreddit | undefined>;
  createSubreddit(subreddit: InsertSubreddit): Promise<Subreddit>;
  updateSubreddit(id: number, subreddit: Partial<InsertSubreddit>): Promise<Subreddit | undefined>;

  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;
  getActiveCampaignCount(): Promise<number>;

  // Reddit Posts
  getRedditPosts(): Promise<RedditPost[]>;
  getRedditPostsByCampaign(campaignId: number): Promise<RedditPost[]>;
  getRedditPostsByStatus(status: string): Promise<RedditPost[]>;
  getRedditPost(id: number): Promise<RedditPost | undefined>;
  createRedditPost(post: InsertRedditPost): Promise<RedditPost>;
  updateRedditPost(id: number, post: Partial<InsertRedditPost>): Promise<RedditPost | undefined>;
  deleteRedditPost(id: number): Promise<boolean>;
  getPendingScheduledPosts(): Promise<RedditPost[]>;

  // Performance Metrics
  getMetricsByCampaign(campaignId: number): Promise<PerformanceMetric[]>;
  getMetricsByDateRange(startDate: Date, endDate: Date): Promise<PerformanceMetric[]>;
  createMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric>;
  updateMetric(id: number, metric: Partial<InsertPerformanceMetric>): Promise<PerformanceMetric | undefined>;
  getPerformanceSummary(): Promise<{ clicks: number, conversions: number, conversionRate: number, revenue: number }>;
  getTopSubreddits(limit?: number): Promise<{ subreddit: string, clicks: number }[]>;

  // Activities
  getActivities(limit?: number): Promise<Activity[]>;
  getActivitiesByCampaign(campaignId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Content Templates
  getContentTemplates(): Promise<ContentTemplate[]>;
  getContentTemplatesByType(contentType: string): Promise<ContentTemplate[]>;
  getContentTemplate(id: number): Promise<ContentTemplate | undefined>;
  createContentTemplate(template: InsertContentTemplate): Promise<ContentTemplate>;
  updateContentTemplate(id: number, template: Partial<InsertContentTemplate>): Promise<ContentTemplate | undefined>;
  deleteContentTemplate(id: number): Promise<boolean>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Keywords
  getKeywords(): Promise<Keyword[]>;
  getKeyword(id: number): Promise<Keyword | undefined>;
  getKeywordByText(keyword: string): Promise<Keyword | undefined>;
  getKeywordsByCampaign(campaignId: number): Promise<Keyword[]>;
  getKeywordsByAffiliateProgram(affiliateProgramId: number): Promise<Keyword[]>;
  createKeyword(keyword: InsertKeyword): Promise<Keyword>;
  updateKeyword(id: number, keyword: Partial<InsertKeyword>): Promise<Keyword | undefined>;
  deleteKeyword(id: number): Promise<boolean>;
  
  // Reddit Opportunities
  getRedditOpportunities(limit?: number): Promise<RedditOpportunity[]>;
  getRedditOpportunitiesByKeyword(keywordId: number): Promise<RedditOpportunity[]>;
  getRedditOpportunitiesByStatus(status: string): Promise<RedditOpportunity[]>;
  getRedditOpportunity(id: number): Promise<RedditOpportunity | undefined>;
  getRedditOpportunityByUrl(url: string): Promise<RedditOpportunity | undefined>;
  createRedditOpportunity(opportunity: InsertRedditOpportunity): Promise<RedditOpportunity>;
  updateRedditOpportunity(id: number, opportunity: Partial<InsertRedditOpportunity>): Promise<RedditOpportunity | undefined>;
  deleteRedditOpportunity(id: number): Promise<boolean>;
  getTopOpportunities(limit?: number): Promise<RedditOpportunity[]>;
  
  // Content Queue
  getContentQueueItems(): Promise<ContentQueueItem[]>;
  getContentQueueItemsByCampaign(campaignId: number): Promise<ContentQueueItem[]>;
  getContentQueueItemsByOpportunity(opportunityId: number): Promise<ContentQueueItem[]>;
  getContentQueueItemsByStatus(status: string): Promise<ContentQueueItem[]>;
  getContentQueueItem(id: number): Promise<ContentQueueItem | undefined>;
  createContentQueueItem(item: InsertContentQueueItem): Promise<ContentQueueItem>;
  updateContentQueueItem(id: number, item: Partial<InsertContentQueueItem>): Promise<ContentQueueItem | undefined>;
  deleteContentQueueItem(id: number): Promise<boolean>;
  getPendingContentQueueItems(): Promise<ContentQueueItem[]>;
}

export class MemStorage implements IStorage {
  private affiliatePrograms: Map<number, AffiliateProgram>;
  private subreddits: Map<number, Subreddit>;
  private campaigns: Map<number, Campaign>;
  private redditPosts: Map<number, RedditPost>;
  private metrics: Map<number, PerformanceMetric>;
  private activities: Map<number, Activity>;
  private contentTemplates: Map<number, ContentTemplate>;
  private users: Map<number, User>;
  private keywords: Map<number, Keyword>;
  private redditOpportunities: Map<number, RedditOpportunity>;
  private contentQueue: Map<number, ContentQueueItem>;

  private currentIds: {
    affiliatePrograms: number;
    subreddits: number;
    campaigns: number;
    redditPosts: number;
    metrics: number;
    activities: number;
    contentTemplates: number;
    users: number;
    keywords: number;
    redditOpportunities: number;
    contentQueue: number;
  };

  constructor() {
    this.affiliatePrograms = new Map();
    this.subreddits = new Map();
    this.campaigns = new Map();
    this.redditPosts = new Map();
    this.metrics = new Map();
    this.activities = new Map();
    this.contentTemplates = new Map();
    this.users = new Map();
    this.keywords = new Map();
    this.redditOpportunities = new Map();
    this.contentQueue = new Map();

    this.currentIds = {
      affiliatePrograms: 1,
      subreddits: 1,
      campaigns: 1,
      redditPosts: 1,
      metrics: 1,
      activities: 1,
      contentTemplates: 1,
      users: 1,
      keywords: 1,
      redditOpportunities: 1,
      contentQueue: 1,
    };

    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add sample affiliate programs
    const affiliatePrograms: InsertAffiliateProgram[] = [
      {
        name: "WriterAI",
        description: "AI-powered writing assistant tool for content creators and marketers",
        website: "https://writerai.example.com",
        commissionRate: 25,
        commissionType: "percentage",
        payoutThreshold: 50,
        payoutFrequency: "monthly",
        category: "SaaS",
        active: true,
      },
      {
        name: "FinanceMarket",
        description: "Trading platform for stocks, forex, and crypto",
        website: "https://financemarket.example.com",
        commissionRate: 15,
        commissionType: "percentage",
        payoutThreshold: 100,
        payoutFrequency: "bi-weekly",
        category: "Finance",
        active: true,
      },
      {
        name: "TechAcademy",
        description: "Online programming courses and certifications",
        website: "https://techacademy.example.com",
        commissionRate: 20,
        commissionType: "percentage",
        payoutThreshold: 75,
        payoutFrequency: "monthly",
        category: "E-learning",
        active: true,
      },
      {
        name: "CloudStack",
        description: "Enterprise cloud infrastructure solutions",
        website: "https://cloudstack.example.com",
        commissionRate: 10,
        commissionType: "percentage",
        payoutThreshold: 150,
        payoutFrequency: "monthly",
        category: "SaaS",
        active: true,
      }
    ];

    affiliatePrograms.forEach(program => this.createAffiliateProgram(program));

    // Add sample subreddits
    const subreddits: InsertSubreddit[] = [
      {
        name: "r/writing",
        description: "For writers, by writers",
        subscribers: 2500000,
        postingRules: "No self-promotion except in weekly thread. Content must be writing-related.",
        bestTimeToPost: "Weekdays, 2pm-4pm ET",
        categoryTags: ["writing", "creativity", "publishing"],
      },
      {
        name: "r/freelance",
        description: "Community for freelancers in all fields",
        subscribers: 350000,
        postingRules: "No job postings. No self-promotion outside of dedicated threads.",
        bestTimeToPost: "Weekdays, 9am-11am ET",
        categoryTags: ["freelancing", "business", "remote work"],
      },
      {
        name: "r/investing",
        description: "Discussing news, strategies, and tips for investing",
        subscribers: 1800000,
        postingRules: "No low-effort posts. No financial advice requests.",
        bestTimeToPost: "Weekdays, 8am-10am ET",
        categoryTags: ["investing", "finance", "stocks"],
      },
      {
        name: "r/personalfinance",
        description: "Learn about budgeting, saving, and investing",
        subscribers: 15000000,
        postingRules: "No marketing, advertising, or self-promotion. No referral links.",
        bestTimeToPost: "Weekends, 10am-12pm ET",
        categoryTags: ["personal finance", "budgeting", "investing"],
      },
      {
        name: "r/learnprogramming",
        description: "For beginners learning to code",
        subscribers: 3000000,
        postingRules: "No product promotion or advertisement. No help vampires.",
        bestTimeToPost: "Weekdays, 11am-1pm ET",
        categoryTags: ["programming", "learning", "coding"],
      },
      {
        name: "r/webdev",
        description: "Community for web development",
        subscribers: 900000,
        postingRules: "No low-effort posts. No self-promotion outside of Showoff Saturdays.",
        bestTimeToPost: "Weekdays, 1pm-3pm ET",
        categoryTags: ["web development", "programming", "design"],
      },
      {
        name: "r/sysadmin",
        description: "For system administrators",
        subscribers: 700000,
        postingRules: "No product announcements. Enterprise focus.",
        bestTimeToPost: "Weekdays, 9am-11am ET",
        categoryTags: ["system administration", "IT", "networking"],
      },
      {
        name: "r/devops",
        description: "DevOps discussions and resources",
        subscribers: 320000,
        postingRules: "No job listings. No exclusively training/certification posts.",
        bestTimeToPost: "Weekdays, 10am-12pm ET",
        categoryTags: ["devops", "automation", "cloud"],
      },
    ];

    subreddits.forEach(subreddit => this.createSubreddit(subreddit));

    // Add sample campaigns
    const campaigns: InsertCampaign[] = [
      {
        name: "AI Writing Assistant Pro",
        affiliateProgramId: 1,
        description: "Promoting the WriterAI Pro plan with exclusive discount",
        targetSubreddits: ["r/writing", "r/freelance"],
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        budget: 150,
        schedule: {
          frequency: "daily",
          timeRanges: ["14:00-16:00"],
          timezone: "America/New_York",
        },
      },
      {
        name: "InvestPro Trading Platform",
        affiliateProgramId: 2,
        description: "Highlighting FinanceMarket's advanced trading tools",
        targetSubreddits: ["r/investing", "r/personalfinance"],
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        budget: 300,
        schedule: {
          frequency: "weekly",
          daysOfWeek: [1, 4], // Monday and Thursday
          timeRanges: ["10:00-12:00"],
          timezone: "America/New_York",
        },
      },
      {
        name: "CodeMaster Pro Course",
        affiliateProgramId: 3,
        description: "Promoting TechAcademy's premium coding bootcamp",
        targetSubreddits: ["r/learnprogramming", "r/webdev"],
        status: "scheduled",
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        budget: 250,
        schedule: {
          frequency: "custom",
          daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
          timeRanges: ["11:00-13:00", "17:00-19:00"],
          timezone: "America/New_York",
        },
      },
      {
        name: "CloudStack Enterprise",
        affiliateProgramId: 4,
        description: "Enterprise cloud infrastructure with special pricing",
        targetSubreddits: ["r/sysadmin", "r/devops"],
        status: "paused",
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        budget: 200,
        schedule: {
          frequency: "weekly",
          daysOfWeek: [2, 4], // Tuesday and Thursday
          timeRanges: ["09:00-11:00"],
          timezone: "America/New_York",
        },
      },
    ];

    campaigns.forEach(campaign => this.createCampaign(campaign));

    // Add sample performance metrics
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const metrics: InsertPerformanceMetric[] = [
      {
        campaignId: 1,
        date: today,
        clicks: 432,
        impressions: 2150,
        conversions: 8,
        revenue: 842.15,
      },
      {
        campaignId: 2,
        date: today,
        clicks: 315,
        impressions: 1850,
        conversions: 5,
        revenue: 1245.00,
      },
      {
        campaignId: 4,
        date: yesterday,
        clicks: 78,
        impressions: 950,
        conversions: 1,
        revenue: 120.00,
      },
    ];

    metrics.forEach(metric => this.createMetric(metric));

    // Add sample activities
    const activities: InsertActivity[] = [
      {
        campaignId: 1,
        type: "post_published",
        message: "AI Writing Assistant Pro post was published to r/writing",
        details: { subreddit: "r/writing", postId: "abc123" },
      },
      {
        campaignId: 2,
        type: "comments_received",
        message: "InvestPro Trading Platform received 12 comments on thread in r/investing",
        details: { subreddit: "r/investing", postId: "def456", commentCount: 12 },
      },
      {
        campaignId: 4,
        type: "campaign_paused",
        message: "CloudStack Enterprise campaign was paused due to low performance",
        details: { reason: "low_performance", metrics: { clicks: 78, conversions: 1 } },
      },
      {
        campaignId: 3,
        type: "content_generated",
        message: "AI generated 5 new content pieces for CodeMaster Pro Course",
        details: { count: 5, contentType: "post" },
      },
    ];

    activities.forEach(activity => this.createActivity(activity));

    // Add sample content templates
    const contentTemplates: InsertContentTemplate[] = [
      {
        title: "Question and Solution Template",
        template: "Is anyone else frustrated with [PROBLEM]? I've been trying to solve this for weeks until I found [PRODUCT]. It's been a game-changer because [BENEFIT1], [BENEFIT2], and [BENEFIT3]. Highly recommend checking it out.",
        contentType: "post",
        category: "Software",
        tags: ["problem-solution", "recommendation", "personal-experience"],
      },
      {
        title: "Tutorial Share Template",
        template: "I just published a comprehensive guide on [TOPIC] that might help some of you. In it, I cover [POINT1], [POINT2], and how to use [PRODUCT] to [ACHIEVEMENT]. Let me know if you have any questions!",
        contentType: "post",
        category: "Education",
        tags: ["tutorial", "guide", "resource-sharing"],
      },
      {
        title: "Helpful Comment Template",
        template: "For this specific situation, you might want to try [PRODUCT]. It handles [PROBLEM] really well because [REASON]. I personally use it for [USE_CASE] and it's saved me a ton of time.",
        contentType: "comment",
        category: "General",
        tags: ["helpful", "recommendation", "problem-solving"],
      },
    ];

    contentTemplates.forEach(template => this.createContentTemplate(template));

    // Add sample Reddit posts
    const now = new Date();
    
    // Calculate future scheduled times
    const scheduledTime1 = new Date(now);
    scheduledTime1.setHours(14, 15, 0, 0); // Today at 2:15pm
    
    const scheduledTime2 = new Date(now);
    scheduledTime2.setHours(15, 30, 0, 0); // Today at 3:30pm
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // Tomorrow at 10:00am
    
    const tomorrowAfternoon = new Date(tomorrow);
    tomorrowAfternoon.setHours(14, 15, 0, 0); // Tomorrow at 2:15pm

    const redditPosts: InsertRedditPost[] = [
      {
        campaignId: 1,
        subredditName: "r/writing",
        title: "How I overcame writer's block with AI assistance",
        content: "I've been struggling with writer's block for months until I found WriterAI Pro. The AI-generated prompts and sentence completions have completely transformed my workflow. Now I can focus on the creative aspects while the AI handles the basic structure. Has anyone else tried AI writing tools? What's been your experience?",
        status: "scheduled",
        postType: "post",
        scheduledTime: scheduledTime1,
        affiliateLink: "https://writerai.example.com?ref=aff123",
      },
      {
        campaignId: 1,
        subredditName: "r/freelance",
        title: "Tools that increased my writing productivity by 50%",
        content: "As a freelance writer, productivity is directly tied to income. I recently started using WriterAI Pro and it's increased my output by about 50%. The AI helps with research, outlining, and even generates first drafts that I can refine. For anyone handling multiple writing projects, tools like this are game-changers. What productivity tools are you using in your freelance work?",
        status: "scheduled",
        postType: "post",
        scheduledTime: scheduledTime2,
        affiliateLink: "https://writerai.example.com?ref=aff123",
      },
      {
        campaignId: 2,
        subredditName: "r/investing",
        title: "Advanced trading analysis tools for retail investors",
        content: "I've been using InvestPro's trading platform for the past 3 months and wanted to share my experience. Their technical analysis tools are surprisingly sophisticated for a platform accessible to retail investors. The pattern recognition feature has been especially useful for identifying potential breakouts. Has anyone else used their risk assessment calculator? How has it impacted your trading decisions?",
        status: "scheduled",
        postType: "post",
        scheduledTime: tomorrow,
        affiliateLink: "https://financemarket.example.com?ref=aff456",
      },
      {
        campaignId: 1,
        subredditName: "r/writing",
        title: "AI writing assistants - ethical considerations",
        content: "As writers, we need to consider the ethical implications of using AI assistants like WriterAI Pro. While they dramatically improve efficiency, we should discuss how to use them responsibly. I've found the tool helps most with overcoming blocks and generating ideas, while the actual voice and style still require human creativity. How do you balance AI assistance with maintaining your authentic voice?",
        status: "scheduled",
        postType: "post",
        scheduledTime: tomorrowAfternoon,
        affiliateLink: "https://writerai.example.com?ref=aff123",
      },
    ];

    redditPosts.forEach(post => this.createRedditPost(post));

    // Create a sample user
    this.createUser({
      username: "admin",
      password: "password", // In a real app, this would be hashed
      email: "admin@example.com",
      apiUsageLimit: 10000,
    });

    // Add sample keywords
    const keywords: InsertKeyword[] = [
      {
        keyword: "best gaming mouse",
        campaignId: 1,
        affiliateProgramId: 1,
        status: "active",
        priority: "high",
        lastScannedAt: null,
      },
      {
        keyword: "mechanical keyboard review",
        campaignId: 1,
        affiliateProgramId: 1,
        status: "active",
        priority: "medium",
        lastScannedAt: null,
      },
      {
        keyword: "gaming headset comparison",
        campaignId: 1,
        affiliateProgramId: 1,
        status: "active",
        priority: "low",
        lastScannedAt: null,
      }
    ];

    keywords.forEach(keyword => this.createKeyword(keyword));

    // Add sample opportunities
    const opportunities: InsertRedditOpportunity[] = [
      {
        keywordId: 1,
        url: "https://www.reddit.com/r/gaming/comments/sample1",
        title: "Looking for recommendations on gaming mice",
        snippet: "I've been using the same mouse for 5 years and need a new one. Any recommendations?",
        subreddit: "r/gaming",
        rank: 1,
        actionType: "comment",
        status: "new",
        opportunityScore: 85,
      },
      {
        keywordId: 2,
        url: "https://www.reddit.com/r/MechanicalKeyboards/comments/sample2",
        title: "Best mechanical keyboards under $100?",
        snippet: "Looking for a good mechanical keyboard that won't break the bank.",
        subreddit: "r/MechanicalKeyboards",
        rank: 3,
        actionType: "post",
        status: "queued",
        opportunityScore: 72,
      },
      {
        keywordId: 3,
        url: "https://www.reddit.com/r/headphones/comments/sample3",
        title: "Gaming headset vs. regular headphones for gaming",
        snippet: "Is it worth buying a dedicated gaming headset or should I get regular headphones?",
        subreddit: "r/headphones",
        rank: 2,
        actionType: "comment",
        status: "completed",
        opportunityScore: 65,
      }
    ];

    opportunities.forEach(opportunity => this.createRedditOpportunity(opportunity));

    // Add sample content queue items
    const queueItems: InsertContentQueueItem[] = [
      {
        opportunityId: 2,
        campaignId: 1,
        type: "post",
        status: "pending",
        content: "# My Experience with Budget Mechanical Keyboards\n\nAfter trying several options under $100, here's my take...",
        scheduledTime: new Date(Date.now() + 86400000), // Tomorrow
        title: "Best Mechanical Keyboards under $100 - My Personal Review",
        subreddit: "r/MechanicalKeyboards",
      }
    ];

    queueItems.forEach(item => this.createContentQueueItem(item));
  }

  // Affiliate Programs methods
  async getAffiliatePrograms(): Promise<AffiliateProgram[]> {
    return Array.from(this.affiliatePrograms.values());
  }

  async getAffiliateProgram(id: number): Promise<AffiliateProgram | undefined> {
    return this.affiliatePrograms.get(id);
  }

  async createAffiliateProgram(program: InsertAffiliateProgram): Promise<AffiliateProgram> {
    const id = this.currentIds.affiliatePrograms++;
    const timestamp = new Date();
    const newProgram: AffiliateProgram = { ...program, id, createdAt: timestamp };
    this.affiliatePrograms.set(id, newProgram);
    return newProgram;
  }

  async updateAffiliateProgram(id: number, program: Partial<InsertAffiliateProgram>): Promise<AffiliateProgram | undefined> {
    const existingProgram = this.affiliatePrograms.get(id);
    if (!existingProgram) {
      return undefined;
    }

    const updatedProgram: AffiliateProgram = { ...existingProgram, ...program };
    this.affiliatePrograms.set(id, updatedProgram);
    return updatedProgram;
  }

  async deleteAffiliateProgram(id: number): Promise<boolean> {
    return this.affiliatePrograms.delete(id);
  }

  // Subreddits methods
  async getSubreddits(): Promise<Subreddit[]> {
    return Array.from(this.subreddits.values());
  }

  async getSubreddit(id: number): Promise<Subreddit | undefined> {
    return this.subreddits.get(id);
  }

  async getSubredditByName(name: string): Promise<Subreddit | undefined> {
    return Array.from(this.subreddits.values()).find(
      (subreddit) => subreddit.name === name
    );
  }

  async createSubreddit(subreddit: InsertSubreddit): Promise<Subreddit> {
    const id = this.currentIds.subreddits++;
    const timestamp = new Date();
    const newSubreddit: Subreddit = { ...subreddit, id, createdAt: timestamp };
    this.subreddits.set(id, newSubreddit);
    return newSubreddit;
  }

  async updateSubreddit(id: number, subreddit: Partial<InsertSubreddit>): Promise<Subreddit | undefined> {
    const existingSubreddit = this.subreddits.get(id);
    if (!existingSubreddit) {
      return undefined;
    }

    const updatedSubreddit: Subreddit = { ...existingSubreddit, ...subreddit };
    this.subreddits.set(id, updatedSubreddit);
    return updatedSubreddit;
  }

  // Campaigns methods
  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const id = this.currentIds.campaigns++;
    const timestamp = new Date();
    const newCampaign: Campaign = { ...campaign, id, createdAt: timestamp };
    this.campaigns.set(id, newCampaign);
    return newCampaign;
  }

  async updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const existingCampaign = this.campaigns.get(id);
    if (!existingCampaign) {
      return undefined;
    }

    const updatedCampaign: Campaign = { ...existingCampaign, ...campaign };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    return this.campaigns.delete(id);
  }

  async getActiveCampaignCount(): Promise<number> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.status === "active"
    ).length;
  }

  // Reddit Posts methods
  async getRedditPosts(): Promise<RedditPost[]> {
    return Array.from(this.redditPosts.values());
  }

  async getRedditPostsByCampaign(campaignId: number): Promise<RedditPost[]> {
    return Array.from(this.redditPosts.values()).filter(
      (post) => post.campaignId === campaignId
    );
  }

  async getRedditPostsByStatus(status: string): Promise<RedditPost[]> {
    return Array.from(this.redditPosts.values()).filter(
      (post) => post.status === status
    );
  }

  async getRedditPost(id: number): Promise<RedditPost | undefined> {
    return this.redditPosts.get(id);
  }

  async createRedditPost(post: InsertRedditPost): Promise<RedditPost> {
    const id = this.currentIds.redditPosts++;
    const timestamp = new Date();
    const newPost: RedditPost = { 
      ...post, 
      id, 
      createdAt: timestamp,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      postedTime: undefined,
      redditPostId: undefined,
    };
    this.redditPosts.set(id, newPost);
    return newPost;
  }

  async updateRedditPost(id: number, post: Partial<InsertRedditPost>): Promise<RedditPost | undefined> {
    const existingPost = this.redditPosts.get(id);
    if (!existingPost) {
      return undefined;
    }

    const updatedPost: RedditPost = { ...existingPost, ...post };
    this.redditPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteRedditPost(id: number): Promise<boolean> {
    return this.redditPosts.delete(id);
  }

  async getPendingScheduledPosts(): Promise<RedditPost[]> {
    const now = new Date();
    return Array.from(this.redditPosts.values()).filter(
      (post) => post.status === "scheduled" && post.scheduledTime && post.scheduledTime <= now
    );
  }

  // Performance Metrics methods
  async getMetricsByCampaign(campaignId: number): Promise<PerformanceMetric[]> {
    return Array.from(this.metrics.values()).filter(
      (metric) => metric.campaignId === campaignId
    );
  }

  async getMetricsByDateRange(startDate: Date, endDate: Date): Promise<PerformanceMetric[]> {
    return Array.from(this.metrics.values()).filter(
      (metric) => metric.date >= startDate && metric.date <= endDate
    );
  }

  async createMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const id = this.currentIds.metrics++;
    const timestamp = new Date();
    const newMetric: PerformanceMetric = { ...metric, id, createdAt: timestamp };
    this.metrics.set(id, newMetric);
    return newMetric;
  }

  async updateMetric(id: number, metric: Partial<InsertPerformanceMetric>): Promise<PerformanceMetric | undefined> {
    const existingMetric = this.metrics.get(id);
    if (!existingMetric) {
      return undefined;
    }

    const updatedMetric: PerformanceMetric = { ...existingMetric, ...metric };
    this.metrics.set(id, updatedMetric);
    return updatedMetric;
  }

  async getPerformanceSummary(): Promise<{ clicks: number, conversions: number, conversionRate: number, revenue: number }> {
    const allMetrics = Array.from(this.metrics.values());
    
    const totalClicks = allMetrics.reduce((sum, metric) => sum + metric.clicks, 0);
    const totalConversions = allMetrics.reduce((sum, metric) => sum + metric.conversions, 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const totalRevenue = allMetrics.reduce((sum, metric) => sum + metric.revenue, 0);

    return {
      clicks: totalClicks,
      conversions: totalConversions,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      revenue: parseFloat(totalRevenue.toFixed(2)),
    };
  }

  async getTopSubreddits(limit: number = 5): Promise<{ subreddit: string, clicks: number }[]> {
    // Aggregate metrics by subreddit through posts
    const subredditClicks = new Map<string, number>();
    
    // For demo purposes, we'll manually set this data
    subredditClicks.set("r/SaaS", 1245);
    subredditClicks.set("r/startups", 986);
    subredditClicks.set("r/webdev", 754);
    subredditClicks.set("r/marketing", 631);
    subredditClicks.set("r/SEO", 498);
    subredditClicks.set("r/writing", 423);
    subredditClicks.set("r/freelance", 389);
    
    return Array.from(subredditClicks.entries())
      .map(([subreddit, clicks]) => ({ subreddit, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, limit);
  }

  // Activities methods
  async getActivities(limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getActivitiesByCampaign(campaignId: number, limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.campaignId === campaignId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.currentIds.activities++;
    const timestamp = new Date();
    const newActivity: Activity = { ...activity, id, timestamp };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  // Content Templates methods
  async getContentTemplates(): Promise<ContentTemplate[]> {
    return Array.from(this.contentTemplates.values());
  }

  async getContentTemplatesByType(contentType: string): Promise<ContentTemplate[]> {
    return Array.from(this.contentTemplates.values()).filter(
      (template) => template.contentType === contentType
    );
  }

  async getContentTemplate(id: number): Promise<ContentTemplate | undefined> {
    return this.contentTemplates.get(id);
  }

  async createContentTemplate(template: InsertContentTemplate): Promise<ContentTemplate> {
    const id = this.currentIds.contentTemplates++;
    const timestamp = new Date();
    const newTemplate: ContentTemplate = { ...template, id, createdAt: timestamp };
    this.contentTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async updateContentTemplate(id: number, template: Partial<InsertContentTemplate>): Promise<ContentTemplate | undefined> {
    const existingTemplate = this.contentTemplates.get(id);
    if (!existingTemplate) {
      return undefined;
    }

    const updatedTemplate: ContentTemplate = { ...existingTemplate, ...template };
    this.contentTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteContentTemplate(id: number): Promise<boolean> {
    return this.contentTemplates.delete(id);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const timestamp = new Date();
    const newUser: User = { ...user, id, apiUsageCount: 0, createdAt: timestamp };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }

    const updatedUser: User = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Keywords
  async getKeywords(): Promise<Keyword[]> {
    return Array.from(this.keywords.values());
  }

  async getKeyword(id: number): Promise<Keyword | undefined> {
    return this.keywords.get(id);
  }

  async getKeywordByText(keyword: string): Promise<Keyword | undefined> {
    return Array.from(this.keywords.values()).find(k => k.keyword.toLowerCase() === keyword.toLowerCase());
  }

  async getKeywordsByCampaign(campaignId: number): Promise<Keyword[]> {
    return Array.from(this.keywords.values()).filter(k => k.campaignId === campaignId);
  }

  async getKeywordsByAffiliateProgram(affiliateProgramId: number): Promise<Keyword[]> {
    return Array.from(this.keywords.values()).filter(k => k.affiliateProgramId === affiliateProgramId);
  }

  async createKeyword(keyword: InsertKeyword): Promise<Keyword> {
    const id = ++this.currentIds.keywords;
    const timestamp = new Date();
    const newKeyword: Keyword = { ...keyword, id, createdAt: timestamp };
    this.keywords.set(id, newKeyword);
    return newKeyword;
  }

  async updateKeyword(id: number, keyword: Partial<InsertKeyword>): Promise<Keyword | undefined> {
    const existingKeyword = this.keywords.get(id);
    if (!existingKeyword) {
      return undefined;
    }

    const updatedKeyword: Keyword = { ...existingKeyword, ...keyword };
    this.keywords.set(id, updatedKeyword);
    return updatedKeyword;
  }

  async deleteKeyword(id: number): Promise<boolean> {
    return this.keywords.delete(id);
  }

  // Reddit Opportunities
  async getRedditOpportunities(limit: number = 100): Promise<RedditOpportunity[]> {
    const opportunities = Array.from(this.redditOpportunities.values());
    return opportunities.slice(0, limit);
  }

  async getRedditOpportunitiesByKeyword(keywordId: number): Promise<RedditOpportunity[]> {
    return Array.from(this.redditOpportunities.values()).filter(o => o.keywordId === keywordId);
  }

  async getRedditOpportunitiesByStatus(status: string): Promise<RedditOpportunity[]> {
    return Array.from(this.redditOpportunities.values()).filter(o => o.status === status);
  }

  async getRedditOpportunity(id: number): Promise<RedditOpportunity | undefined> {
    return this.redditOpportunities.get(id);
  }

  async getRedditOpportunityByUrl(url: string): Promise<RedditOpportunity | undefined> {
    return Array.from(this.redditOpportunities.values()).find(o => o.url === url);
  }

  async createRedditOpportunity(opportunity: InsertRedditOpportunity): Promise<RedditOpportunity> {
    const id = ++this.currentIds.redditOpportunities;
    const timestamp = new Date();
    const newOpportunity: RedditOpportunity = { ...opportunity, id, createdAt: timestamp };
    this.redditOpportunities.set(id, newOpportunity);
    return newOpportunity;
  }

  async updateRedditOpportunity(id: number, opportunity: Partial<InsertRedditOpportunity>): Promise<RedditOpportunity | undefined> {
    const existingOpportunity = this.redditOpportunities.get(id);
    if (!existingOpportunity) {
      return undefined;
    }

    const updatedOpportunity: RedditOpportunity = { ...existingOpportunity, ...opportunity };
    this.redditOpportunities.set(id, updatedOpportunity);
    return updatedOpportunity;
  }

  async deleteRedditOpportunity(id: number): Promise<boolean> {
    return this.redditOpportunities.delete(id);
  }

  async getTopOpportunities(limit: number = 5): Promise<RedditOpportunity[]> {
    const opportunities = Array.from(this.redditOpportunities.values())
      .filter(o => o.status === 'new')
      .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0));
    
    return opportunities.slice(0, limit);
  }

  // Content Queue
  async getContentQueueItems(): Promise<ContentQueueItem[]> {
    return Array.from(this.contentQueue.values());
  }

  async getContentQueueItemsByCampaign(campaignId: number): Promise<ContentQueueItem[]> {
    return Array.from(this.contentQueue.values()).filter(item => item.campaignId === campaignId);
  }

  async getContentQueueItemsByOpportunity(opportunityId: number): Promise<ContentQueueItem[]> {
    return Array.from(this.contentQueue.values()).filter(item => item.opportunityId === opportunityId);
  }

  async getContentQueueItemsByStatus(status: string): Promise<ContentQueueItem[]> {
    return Array.from(this.contentQueue.values()).filter(item => item.status === status);
  }

  async getContentQueueItem(id: number): Promise<ContentQueueItem | undefined> {
    return this.contentQueue.get(id);
  }

  async createContentQueueItem(item: InsertContentQueueItem): Promise<ContentQueueItem> {
    const id = ++this.currentIds.contentQueue;
    const timestamp = new Date();
    const newItem: ContentQueueItem = { ...item, id, createdAt: timestamp };
    this.contentQueue.set(id, newItem);
    return newItem;
  }

  async updateContentQueueItem(id: number, item: Partial<InsertContentQueueItem>): Promise<ContentQueueItem | undefined> {
    const existingItem = this.contentQueue.get(id);
    if (!existingItem) {
      return undefined;
    }

    const updatedItem: ContentQueueItem = { ...existingItem, ...item };
    this.contentQueue.set(id, updatedItem);
    return updatedItem;
  }

  async deleteContentQueueItem(id: number): Promise<boolean> {
    return this.contentQueue.delete(id);
  }

  async getPendingContentQueueItems(): Promise<ContentQueueItem[]> {
    return Array.from(this.contentQueue.values())
      .filter(item => item.status === 'pending' && (item.scheduledTime && new Date(item.scheduledTime) <= new Date()));
  }
}

export class FileStorage implements IStorage {
  constructor() {
    // Initialize database on startup
    initializeDatabase().catch(error => {
      console.error('Failed to initialize database:', error);
    });
  }

  // Affiliate Programs
  async getAffiliatePrograms(): Promise<AffiliateProgram[]> {
    try {
      const result = await query('SELECT * FROM affiliate_programs ORDER BY name');
      return toCamelCase(result.rows);
    } catch (error) {
      console.error('Error fetching affiliate programs:', error);
      return [];
    }
  }

  async getAffiliateProgram(id: number): Promise<AffiliateProgram | undefined> {
    try {
      const result = await query('SELECT * FROM affiliate_programs WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error fetching affiliate program with id ${id}:`, error);
      return undefined;
    }
  }

  async createAffiliateProgram(program: InsertAffiliateProgram): Promise<AffiliateProgram> {
    try {
      const values = toSnakeCase(program);
      const keys = Object.keys(values);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');
      
      const result = await query(
        `INSERT INTO affiliate_programs (${columns}) 
         VALUES (${placeholders}) 
         RETURNING *`,
        Object.values(values)
      );
      
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error('Error creating affiliate program:', error);
      throw error;
    }
  }

  async updateAffiliateProgram(id: number, program: Partial<InsertAffiliateProgram>): Promise<AffiliateProgram | undefined> {
    try {
      const values = toSnakeCase(program);
      const updates = Object.keys(values)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');
      
      const result = await query(
        `UPDATE affiliate_programs 
         SET ${updates}
         WHERE id = $${Object.keys(values).length + 1}
         RETURNING *`,
        [...Object.values(values), id]
      );
      
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error updating affiliate program with id ${id}:`, error);
      return undefined;
    }
  }

  async deleteAffiliateProgram(id: number): Promise<boolean> {
    try {
      const result = await query('DELETE FROM affiliate_programs WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting affiliate program with id ${id}:`, error);
      return false;
    }
  }

  // Subreddits
  async getSubreddits(): Promise<Subreddit[]> {
    try {
      const result = await query('SELECT * FROM subreddits ORDER BY name');
      return toCamelCase(result.rows);
    } catch (error) {
      console.error('Error fetching subreddits:', error);
      return [];
    }
  }

  async getSubreddit(id: number): Promise<Subreddit | undefined> {
    try {
      const result = await query('SELECT * FROM subreddits WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error fetching subreddit with id ${id}:`, error);
      return undefined;
    }
  }

  async getSubredditByName(name: string): Promise<Subreddit | undefined> {
    try {
      const result = await query('SELECT * FROM subreddits WHERE name = $1', [name]);
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error fetching subreddit with name ${name}:`, error);
      return undefined;
    }
  }

  async createSubreddit(subreddit: InsertSubreddit): Promise<Subreddit> {
    try {
      const values = toSnakeCase(subreddit);
      const keys = Object.keys(values);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');
      
      const result = await query(
        `INSERT INTO subreddits (${columns}) 
         VALUES (${placeholders}) 
         RETURNING *`,
        Object.values(values)
      );
      
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error('Error creating subreddit:', error);
      throw error;
    }
  }

  async updateSubreddit(id: number, subreddit: Partial<InsertSubreddit>): Promise<Subreddit | undefined> {
    try {
      const values = toSnakeCase(subreddit);
      const updates = Object.keys(values)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');
      
      const result = await query(
        `UPDATE subreddits
         SET ${updates}
         WHERE id = $${Object.keys(values).length + 1}
         RETURNING *`,
        [...Object.values(values), id]
      );
      
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error updating subreddit with id ${id}:`, error);
      return undefined;
    }
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    try {
      const result = await query('SELECT * FROM campaigns ORDER BY name');
      return toCamelCase(result.rows);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    try {
      const result = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error fetching campaign with id ${id}:`, error);
      return undefined;
    }
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    try {
      const values = toSnakeCase(campaign);
      
      // Handle schedule object
      if (values.schedule) {
        values.schedule = JSON.stringify(values.schedule);
      }
      
      const keys = Object.keys(values);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');
      
      const result = await query(
        `INSERT INTO campaigns (${columns}) 
         VALUES (${placeholders}) 
         RETURNING *`,
        Object.values(values)
      );
      
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  async updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    try {
      const values = toSnakeCase(campaign);
      
      // Handle schedule object
      if (values.schedule) {
        values.schedule = JSON.stringify(values.schedule);
      }
      
      const updates = Object.keys(values)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');
      
      const result = await query(
        `UPDATE campaigns
         SET ${updates}
         WHERE id = $${Object.keys(values).length + 1}
         RETURNING *`,
        [...Object.values(values), id]
      );
      
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error updating campaign with id ${id}:`, error);
      return undefined;
    }
  }

  async deleteCampaign(id: number): Promise<boolean> {
    try {
      const result = await query('DELETE FROM campaigns WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting campaign with id ${id}:`, error);
      return false;
    }
  }

  async getActiveCampaignCount(): Promise<number> {
    try {
      const result = await query("SELECT COUNT(*) FROM campaigns WHERE status = 'active'");
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('Error counting active campaigns:', error);
      return 0;
    }
  }

  // Reddit Posts
  async getRedditPosts(): Promise<RedditPost[]> {
    try {
      const result = await query('SELECT * FROM reddit_posts ORDER BY created_at DESC');
      return toCamelCase(result.rows);
    } catch (error) {
      console.error('Error fetching reddit posts:', error);
      return [];
    }
  }

  async getRedditPostsByCampaign(campaignId: number): Promise<RedditPost[]> {
    try {
      const result = await query(
        'SELECT * FROM reddit_posts WHERE campaign_id = $1 ORDER BY created_at DESC',
        [campaignId]
      );
      return toCamelCase(result.rows);
    } catch (error) {
      console.error(`Error fetching reddit posts for campaign ${campaignId}:`, error);
      return [];
    }
  }

  async getRedditPostsByStatus(status: string): Promise<RedditPost[]> {
    try {
      const result = await query(
        'SELECT * FROM reddit_posts WHERE status = $1 ORDER BY created_at DESC',
        [status]
      );
      return toCamelCase(result.rows);
    } catch (error) {
      console.error(`Error fetching reddit posts with status ${status}:`, error);
      return [];
    }
  }

  async getRedditPost(id: number): Promise<RedditPost | undefined> {
    try {
      const result = await query('SELECT * FROM reddit_posts WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error fetching reddit post with id ${id}:`, error);
      return undefined;
    }
  }

  async createRedditPost(post: InsertRedditPost): Promise<RedditPost> {
    try {
      const values = toSnakeCase(post);
      const keys = Object.keys(values);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');
      
      const result = await query(
        `INSERT INTO reddit_posts (${columns}) 
         VALUES (${placeholders}) 
         RETURNING *`,
        Object.values(values)
      );
      
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error('Error creating reddit post:', error);
      throw error;
    }
  }

  async updateRedditPost(id: number, post: Partial<InsertRedditPost>): Promise<RedditPost | undefined> {
    try {
      const values = toSnakeCase(post);
      const updates = Object.keys(values)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');
      
      const result = await query(
        `UPDATE reddit_posts
         SET ${updates}
         WHERE id = $${Object.keys(values).length + 1}
         RETURNING *`,
        [...Object.values(values), id]
      );
      
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error updating reddit post with id ${id}:`, error);
      return undefined;
    }
  }

  async deleteRedditPost(id: number): Promise<boolean> {
    try {
      const result = await query('DELETE FROM reddit_posts WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting reddit post with id ${id}:`, error);
      return false;
    }
  }

  async getPendingScheduledPosts(): Promise<RedditPost[]> {
    try {
      const now = new Date();
      const result = await query(
        "SELECT * FROM reddit_posts WHERE status = 'scheduled' AND scheduled_time <= $1",
        [now]
      );
      return toCamelCase(result.rows);
    } catch (error) {
      console.error('Error fetching pending scheduled posts:', error);
      return [];
    }
  }

  // Performance Metrics
  async getMetricsByCampaign(campaignId: number): Promise<PerformanceMetric[]> {
    try {
      const result = await query(
        'SELECT * FROM performance_metrics WHERE campaign_id = $1 ORDER BY date DESC',
        [campaignId]
      );
      return toCamelCase(result.rows);
    } catch (error) {
      console.error(`Error fetching metrics for campaign ${campaignId}:`, error);
      return [];
    }
  }

  async getMetricsByDateRange(startDate: Date, endDate: Date): Promise<PerformanceMetric[]> {
    try {
      const result = await query(
        'SELECT * FROM performance_metrics WHERE date BETWEEN $1 AND $2 ORDER BY date',
        [startDate, endDate]
      );
      return toCamelCase(result.rows);
    } catch (error) {
      console.error(`Error fetching metrics between ${startDate} and ${endDate}:`, error);
      return [];
    }
  }

  async createMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    try {
      const values = toSnakeCase(metric);
      const keys = Object.keys(values);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');
      
      const result = await query(
        `INSERT INTO performance_metrics (${columns}) 
         VALUES (${placeholders}) 
         RETURNING *`,
        Object.values(values)
      );
      
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error('Error creating performance metric:', error);
      throw error;
    }
  }

  async updateMetric(id: number, metric: Partial<InsertPerformanceMetric>): Promise<PerformanceMetric | undefined> {
    try {
      const values = toSnakeCase(metric);
      const updates = Object.keys(values)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');
      
      const result = await query(
        `UPDATE performance_metrics
         SET ${updates}
         WHERE id = $${Object.keys(values).length + 1}
         RETURNING *`,
        [...Object.values(values), id]
      );
      
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error updating performance metric with id ${id}:`, error);
      return undefined;
    }
  }

  async getPerformanceSummary(): Promise<{ clicks: number, conversions: number, conversionRate: number, revenue: number }> {
    try {
      const result = await query(`
        SELECT 
          SUM(clicks) as total_clicks,
          SUM(conversions) as total_conversions,
          SUM(revenue) as total_revenue
        FROM performance_metrics
      `);
      
      if (result.rows.length === 0) {
        return { clicks: 0, conversions: 0, conversionRate: 0, revenue: 0 };
      }
      
      const totalClicks = parseInt(result.rows[0].total_clicks || '0', 10);
      const totalConversions = parseInt(result.rows[0].total_conversions || '0', 10);
      const totalRevenue = parseFloat(result.rows[0].total_revenue || '0');
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      
      return {
        clicks: totalClicks,
        conversions: totalConversions,
        conversionRate,
        revenue: totalRevenue,
      };
    } catch (error) {
      console.error('Error fetching performance summary:', error);
      return { clicks: 0, conversions: 0, conversionRate: 0, revenue: 0 };
    }
  }

  async getTopSubreddits(limit: number = 5): Promise<{ subreddit: string, clicks: number }[]> {
    try {
      const result = await query(`
        SELECT 
          r.subreddit_name as subreddit, 
          COALESCE(SUM(p.clicks), 0) as total_clicks
        FROM reddit_posts r
        LEFT JOIN performance_metrics p ON r.id = p.campaign_id
        WHERE r.status = 'posted'
        GROUP BY r.subreddit_name
        ORDER BY total_clicks DESC
        LIMIT $1
      `, [limit]);
      
      // If no results, return some default data
      if (result.rows.length === 0) {
        return [
          { subreddit: "r/programming", clicks: 245 },
          { subreddit: "r/technology", clicks: 189 },
          { subreddit: "r/marketing", clicks: 156 }
        ];
      }
      
      return result.rows.map(row => ({
        subreddit: row.subreddit,
        clicks: parseInt(row.total_clicks || '0', 10),
      }));
    } catch (error) {
      console.error('Error fetching top subreddits:', error);
      // Return some default data on error for MVP demonstration
      return [
        { subreddit: "r/programming", clicks: 245 },
        { subreddit: "r/technology", clicks: 189 },
        { subreddit: "r/marketing", clicks: 156 }
      ];
    }
  }

  // Activities
  async getActivities(limit: number = 10): Promise<Activity[]> {
    try {
      const result = await query(
        'SELECT * FROM activities ORDER BY timestamp DESC LIMIT $1',
        [limit]
      );
      return toCamelCase(result.rows);
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  async getActivitiesByCampaign(campaignId: number, limit: number = 10): Promise<Activity[]> {
    try {
      const result = await query(
        'SELECT * FROM activities WHERE campaign_id = $1 ORDER BY timestamp DESC LIMIT $2',
        [campaignId, limit]
      );
      return toCamelCase(result.rows);
    } catch (error) {
      console.error(`Error fetching activities for campaign ${campaignId}:`, error);
      return [];
    }
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    try {
      const values = toSnakeCase(activity);
      
      // Handle details object
      if (values.details) {
        values.details = JSON.stringify(values.details);
      }
      
      const keys = Object.keys(values);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');
      
      const result = await query(
        `INSERT INTO activities (${columns}) 
         VALUES (${placeholders}) 
         RETURNING *`,
        Object.values(values)
      );
      
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  // Content Templates
  async getContentTemplates(): Promise<ContentTemplate[]> {
    try {
      const result = await query('SELECT * FROM content_templates ORDER BY title');
      return toCamelCase(result.rows);
    } catch (error) {
      console.error('Error fetching content templates:', error);
      return [];
    }
  }

  async getContentTemplatesByType(contentType: string): Promise<ContentTemplate[]> {
    try {
      const result = await query(
        'SELECT * FROM content_templates WHERE content_type = $1 ORDER BY title',
        [contentType]
      );
      return toCamelCase(result.rows);
    } catch (error) {
      console.error(`Error fetching content templates of type ${contentType}:`, error);
      return [];
    }
  }

  async getContentTemplate(id: number): Promise<ContentTemplate | undefined> {
    try {
      const result = await query('SELECT * FROM content_templates WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error fetching content template with id ${id}:`, error);
      return undefined;
    }
  }

  async createContentTemplate(template: InsertContentTemplate): Promise<ContentTemplate> {
    try {
      const values = toSnakeCase(template);
      const keys = Object.keys(values);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');
      
      const result = await query(
        `INSERT INTO content_templates (${columns}) 
         VALUES (${placeholders}) 
         RETURNING *`,
        Object.values(values)
      );
      
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error('Error creating content template:', error);
      throw error;
    }
  }

  async updateContentTemplate(id: number, template: Partial<InsertContentTemplate>): Promise<ContentTemplate | undefined> {
    try {
      const values = toSnakeCase(template);
      const updates = Object.keys(values)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');
      
      const result = await query(
        `UPDATE content_templates
         SET ${updates}
         WHERE id = $${Object.keys(values).length + 1}
         RETURNING *`,
        [...Object.values(values), id]
      );
      
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error updating content template with id ${id}:`, error);
      return undefined;
    }
  }

  async deleteContentTemplate(id: number): Promise<boolean> {
    try {
      const result = await query('DELETE FROM content_templates WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting content template with id ${id}:`, error);
      return false;
    }
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error fetching user with id ${id}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error fetching user with username ${username}:`, error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const values = toSnakeCase(user);
      const keys = Object.keys(values);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');
      
      const result = await query(
        `INSERT INTO users (${columns}) 
         VALUES (${placeholders}) 
         RETURNING *`,
        Object.values(values)
      );
      
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const values = toSnakeCase(user);
      const updates = Object.keys(values)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');
      
      const result = await query(
        `UPDATE users
         SET ${updates}
         WHERE id = $${Object.keys(values).length + 1}
         RETURNING *`,
        [...Object.values(values), id]
      );
      
      if (result.rows.length === 0) return undefined;
      return toCamelCase(result.rows[0]);
    } catch (error) {
      console.error(`Error updating user with id ${id}:`, error);
      return undefined;
    }
  }
}

// Switch to PostgreSQL for persistent storage
export const storage = new FileStorage();
