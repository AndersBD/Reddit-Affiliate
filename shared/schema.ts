import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Affiliate Programs
export const affiliatePrograms = pgTable("affiliate_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  commissionRate: doublePrecision("commission_rate"),
  commissionType: text("commission_type"), // percentage, fixed amount
  payoutThreshold: doublePrecision("payout_threshold"),
  payoutFrequency: text("payout_frequency"), // monthly, weekly, etc.
  category: text("category"), // SaaS, Finance, etc.
  active: boolean("active").default(true),
  affiliateLink: text("affiliate_link"), // Main affiliate link for program
  promoCode: text("promo_code"), // Promotion code for discounts
  tags: text("tags").array(), // Tags for categorization and search
  contentGuidelines: text("content_guidelines"), // Program's content guidelines
  targetAudience: text("target_audience"), // Target audience demographics
  promoMaterials: jsonb("promo_materials"), // URLs to promotional materials
  competitorInfo: jsonb("competitor_info"), // Information about competitors
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAffiliateProgramSchema = createInsertSchema(affiliatePrograms).omit({
  id: true,
  createdAt: true,
});

// Subreddits
export const subreddits = pgTable("subreddits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  subscribers: integer("subscribers"),
  postingRules: text("posting_rules"),
  bestTimeToPost: text("best_time_to_post"),
  categoryTags: text("category_tags").array(),
  primaryTopics: text("primary_topics").array(), // Main topics of the subreddit
  userIntent: text("user_intent").array(), // User intent categories (tool discovery, review seeking, etc.)
  contentFormats: text("content_formats").array(), // Recommended content formats
  rules: text("rules").array(), // Posting and compliance rules
  postingTimes: text("posting_times").array(), // Best posting times
  highValueKeywords: text("high_value_keywords").array(), // Keywords to monitor
  engagementMetrics: jsonb("engagement_metrics"), // Stores metrics like avg upvotes, comments, etc.
  moderationLevel: text("moderation_level"), // How strictly moderated (high, medium, low)
  audienceDemographics: jsonb("audience_demographics"), // Demographic info
  competitiveAnalysis: jsonb("competitive_analysis"), // Analysis of top performing content
  category: text("category"), // Category from the list of 12 categories
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubredditSchema = createInsertSchema(subreddits).omit({
  id: true,
  createdAt: true,
});

// Campaigns
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  affiliateProgramId: integer("affiliate_program_id").notNull(),
  description: text("description"),
  targetSubreddits: text("target_subreddits").array(),
  status: text("status").notNull(), // active, paused, scheduled, completed
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: doublePrecision("budget"),
  schedule: jsonb("schedule"), // JSON object for posting schedule
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
});

// Reddit Posts
export const redditPosts = pgTable("reddit_posts", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  subredditName: text("subreddit_name").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull(), // draft, scheduled, posted, removed
  postType: text("post_type").notNull(), // post or comment
  redditPostId: text("reddit_post_id"), // Actual Reddit post ID after posting
  scheduledTime: timestamp("scheduled_time"),
  postedTime: timestamp("posted_time"),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  commentCount: integer("comment_count").default(0),
  affiliateLink: text("affiliate_link"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRedditPostSchema = createInsertSchema(redditPosts).omit({
  id: true,
  createdAt: true,
  upvotes: true,
  downvotes: true,
  commentCount: true,
  postedTime: true,
  redditPostId: true,
});

// Performance Metrics
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  date: timestamp("date").notNull(),
  clicks: integer("clicks").default(0),
  impressions: integer("impressions").default(0),
  conversions: integer("conversions").default(0),
  revenue: doublePrecision("revenue").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  createdAt: true,
});

// Activities (for recent activity log)
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id"),
  type: text("type").notNull(), // post_published, comment_received, campaign_paused, etc.
  message: text("message").notNull(),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

// AI Content Templates
export const contentTemplates = pgTable("content_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  template: text("template").notNull(),
  contentType: text("content_type").notNull(), // post, comment
  category: text("category"), 
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContentTemplateSchema = createInsertSchema(contentTemplates).omit({
  id: true,
  createdAt: true,
});

// User account (for future expansion)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  apiUsageLimit: integer("api_usage_limit").default(1000),
  apiUsageCount: integer("api_usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  apiUsageCount: true,
});

// Type exports for better typesafety
export type AffiliateProgram = typeof affiliatePrograms.$inferSelect;
export type InsertAffiliateProgram = z.infer<typeof insertAffiliateProgramSchema>;

export type Subreddit = typeof subreddits.$inferSelect;
export type InsertSubreddit = z.infer<typeof insertSubredditSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type RedditPost = typeof redditPosts.$inferSelect;
export type InsertRedditPost = z.infer<typeof insertRedditPostSchema>;

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type InsertContentTemplate = z.infer<typeof insertContentTemplateSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Keywords for SERP scraping
export const keywords = pgTable("keywords", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull().unique(),
  status: text("status").notNull().default("active"), // active, paused, completed
  campaignId: integer("campaign_id"), // Optional linkage to campaign
  affiliateProgramId: integer("affiliate_program_id"), // Optional linkage to affiliate program
  lastScanned: timestamp("last_scanned"),
  dateAdded: timestamp("date_added").defaultNow(),
});

export const insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  dateAdded: true,
  lastScanned: true,
});

// Reddit opportunities found through SERP scraping
export const redditOpportunities = pgTable("reddit_opportunities", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id").notNull(),
  keyword: text("keyword").notNull(),
  redditPostUrl: text("reddit_post_url").notNull().unique(),
  title: text("title").notNull(),
  snippet: text("snippet"),
  serpRank: integer("serp_rank"),
  postDate: timestamp("post_date"),
  upvotes: integer("upvotes"),
  subreddit: text("subreddit").notNull(),
  linkable: boolean("linkable").default(true),
  opportunityScore: doublePrecision("opportunity_score"),
  actionType: text("action_type"), // comment, post
  status: text("status").notNull().default("new"), // new, queued, processed, rejected
  dateDiscovered: timestamp("date_discovered").defaultNow(),
  dateProcessed: timestamp("date_processed"),
});

export const insertRedditOpportunitySchema = createInsertSchema(redditOpportunities).omit({
  id: true,
  dateDiscovered: true,
  dateProcessed: true,
});

// Content queue for scheduling posts/comments
export const contentQueue = pgTable("content_queue", {
  id: serial("id").primaryKey(),
  opportunityId: integer("opportunity_id"),
  campaignId: integer("campaign_id"),
  type: text("type").notNull(), // comment, post
  subreddit: text("subreddit").notNull(),
  targetUrl: text("target_url"), // URL of post to comment on (if type=comment)
  content: text("content").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, posted, failed
  redditPostId: text("reddit_post_id"), // Actual ID once posted
  dateCreated: timestamp("date_created").defaultNow(),
  datePosted: timestamp("date_posted"),
});

export const insertContentQueueSchema = createInsertSchema(contentQueue).omit({
  id: true,
  dateCreated: true,
  datePosted: true,
  redditPostId: true,
});

// Type exports for the new tables
export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;

export type RedditOpportunity = typeof redditOpportunities.$inferSelect;
export type InsertRedditOpportunity = z.infer<typeof insertRedditOpportunitySchema>;

export type ContentQueueItem = typeof contentQueue.$inferSelect;
export type InsertContentQueueItem = z.infer<typeof insertContentQueueSchema>;

// Subreddit Categories
export const subredditCategories = pgTable("subreddit_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // Category name (e.g., "Core AI & ML")
  description: text("description"),
  parentCategory: text("parent_category"), // For subcategories
  subredditCount: integer("subreddit_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubredditCategorySchema = createInsertSchema(subredditCategories).omit({
  id: true,
  createdAt: true,
  subredditCount: true,
});

// Create a mapping table for many-to-many relationship between subreddits and categories
export const subredditCategoryMap = pgTable("subreddit_category_map", {
  id: serial("id").primaryKey(),
  subredditId: integer("subreddit_id").notNull(),
  categoryId: integer("category_id").notNull(),
  relevanceScore: doublePrecision("relevance_score").default(1.0), // How relevant the subreddit is to this category
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubredditCategoryMapSchema = createInsertSchema(subredditCategoryMap).omit({
  id: true,
  createdAt: true,
});

export type SubredditCategory = typeof subredditCategories.$inferSelect;
export type InsertSubredditCategory = z.infer<typeof insertSubredditCategorySchema>;

export type SubredditCategoryMap = typeof subredditCategoryMap.$inferSelect;
export type InsertSubredditCategoryMap = z.infer<typeof insertSubredditCategoryMapSchema>;
