import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
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
