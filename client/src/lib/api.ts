import { apiRequest } from "./queryClient";

// Campaign API
export const createCampaign = async (data: any) => {
  const response = await apiRequest("POST", "/api/campaigns", data);
  return response.json();
};

export const updateCampaign = async (id: number, data: any) => {
  const response = await apiRequest("PATCH", `/api/campaigns/${id}`, data);
  return response.json();
};

export const deleteCampaign = async (id: number) => {
  await apiRequest("DELETE", `/api/campaigns/${id}`);
  return { success: true };
};

// Affiliate Program API
export const createAffiliateProgram = async (data: any) => {
  const response = await apiRequest("POST", "/api/affiliate-programs", data);
  return response.json();
};

export const updateAffiliateProgram = async (id: number, data: any) => {
  const response = await apiRequest("PATCH", `/api/affiliate-programs/${id}`, data);
  return response.json();
};

export const deleteAffiliateProgram = async (id: number) => {
  await apiRequest("DELETE", `/api/affiliate-programs/${id}`);
  return { success: true };
};

// Subreddit API
export const createSubreddit = async (data: any) => {
  const response = await apiRequest("POST", "/api/subreddits", data);
  return response.json();
};

export const updateSubreddit = async (id: number, data: any) => {
  const response = await apiRequest("PATCH", `/api/subreddits/${id}`, data);
  return response.json();
};

// Reddit Post API
export const createRedditPost = async (data: any) => {
  const response = await apiRequest("POST", "/api/reddit-posts", data);
  return response.json();
};

export const updateRedditPost = async (id: number, data: any) => {
  const response = await apiRequest("PATCH", `/api/reddit-posts/${id}`, data);
  return response.json();
};

export const deleteRedditPost = async (id: number) => {
  await apiRequest("DELETE", `/api/reddit-posts/${id}`);
  return { success: true };
};

export const schedulePost = async (id: number, scheduledTime: Date) => {
  const response = await apiRequest("POST", `/api/reddit-posts/${id}/schedule`, { scheduledTime });
  return response.json();
};

export const cancelScheduledPost = async (id: number) => {
  const response = await apiRequest("POST", `/api/reddit-posts/${id}/cancel-schedule`, {});
  return response.json();
};

// Content Generation API
export const generateContent = async (data: {
  campaignId: number;
  subredditName: string;
  contentType: "post" | "comment";
  productFocus?: string;
}) => {
  const response = await apiRequest("POST", "/api/generate-content", data);
  return response.json();
};

export const checkContentCompliance = async (data: {
  content: string;
  subredditName: string;
}) => {
  const response = await apiRequest("POST", "/api/check-compliance", data);
  return response.json();
};

// Reddit API Access
export const getSubredditInfo = async (name: string) => {
  const response = await fetch(`/api/subreddit-info/${name}`, {
    credentials: "include",
  });
  return response.json();
};

export const getBestPostingTime = async (subreddit: string) => {
  const response = await fetch(`/api/best-posting-time/${subreddit}`, {
    credentials: "include",
  });
  return response.json();
};

// Content Template API
export const createContentTemplate = async (data: any) => {
  const response = await apiRequest("POST", "/api/content-templates", data);
  return response.json();
};

export const deleteContentTemplate = async (id: number) => {
  await apiRequest("DELETE", `/api/content-templates/${id}`);
  return { success: true };
};

// Reddit Authentication API
export const getRedditAuthUrl = async () => {
  const response = await fetch("/api/auth/reddit/authorize", {
    credentials: "include",
  });
  return response.json();
};

export const getRedditAuthStatus = async () => {
  const response = await fetch("/api/auth/reddit/status", {
    credentials: "include",
  });
  return response.json();
};

export const disconnectRedditAccount = async () => {
  const response = await apiRequest("POST", "/api/auth/reddit/disconnect", {});
  return response.json();
};

export const saveRedditCredentials = async (credentials: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}) => {
  const response = await apiRequest("POST", "/api/auth/reddit/credentials", credentials);
  return response.json();
};

// Keyword API
export const createKeyword = async (data: any) => {
  const response = await apiRequest("POST", "/api/keywords", data);
  return response.json();
};

export const updateKeyword = async (id: number, data: any) => {
  const response = await apiRequest("PATCH", `/api/keywords/${id}`, data);
  return response.json();
};

export const deleteKeyword = async (id: number) => {
  await apiRequest("DELETE", `/api/keywords/${id}`);
  return { success: true };
};

// Opportunity API
export const getOpportunities = async (status?: string) => {
  const url = status ? `/api/opportunities?status=${status}` : '/api/opportunities';
  const response = await fetch(url, {
    credentials: "include",
  });
  return response.json();
};

export const getOpportunity = async (id: number) => {
  const response = await fetch(`/api/opportunities/${id}`, {
    credentials: "include",
  });
  return response.json();
};

export const updateOpportunity = async (id: number, data: any) => {
  const response = await apiRequest("PATCH", `/api/opportunities/${id}`, data);
  return response.json();
};

export const triggerOpportunityScan = async () => {
  const response = await apiRequest("POST", "/api/opportunities/scan", {});
  return response.json();
};

// Content Queue API
export const createContentQueueItem = async (data: any) => {
  const response = await apiRequest("POST", "/api/content-queue", data);
  return response.json();
};

export const updateContentQueueItem = async (id: number, data: any) => {
  const response = await apiRequest("PATCH", `/api/content-queue/${id}`, data);
  return response.json();
};

export const deleteContentQueueItem = async (id: number) => {
  await apiRequest("DELETE", `/api/content-queue/${id}`);
  return { success: true };
};

// Subreddit Categories API
export const getSubredditCategories = async () => {
  const response = await apiRequest("GET", "/api/categories");
  return response.json();
};

export const categorizeSubreddit = async (subredditId: number) => {
  const response = await apiRequest("GET", `/api/subreddits/categorize/${subredditId}`);
  return response.json();
};

export const getSubredditsByCategory = async (categoryName: string, limit?: number) => {
  const queryParams = limit ? `?limit=${limit}` : '';
  const response = await apiRequest("GET", `/api/subreddits/by-category/${categoryName}${queryParams}`);
  return response.json();
};

export const getRelevantSubredditsForProgram = async (programId: number, limit?: number) => {
  const queryParams = limit ? `?limit=${limit}` : '';
  const response = await apiRequest("GET", `/api/affiliate-programs/${programId}/relevant-subreddits${queryParams}`);
  return response.json();
};

// Advanced Opportunity Analysis API
export const getTopOpportunities = async (limit?: number) => {
  const queryParams = limit ? `?limit=${limit}` : '';
  const response = await apiRequest("GET", `/api/opportunities/top${queryParams}`);
  return response.json();
};

export const analyzeOpportunity = async (opportunityId: number, affiliateProgramId?: number) => {
  const queryParams = affiliateProgramId ? `?affiliateProgramId=${affiliateProgramId}` : '';
  const response = await apiRequest("GET", `/api/opportunities/analyze/${opportunityId}${queryParams}`);
  return response.json();
};

export const rankOpportunitiesForCampaign = async (campaignId: number, limit?: number) => {
  const queryParams = limit ? `?limit=${limit}` : '';
  const response = await apiRequest("GET", `/api/opportunities/rank/${campaignId}${queryParams}`);
  return response.json();
};

// Real-time Reddit Opportunity Fetching
export interface FetchOpportunitiesOptions {
  subreddits?: string[];
  mode?: 'new' | 'hot' | 'top' | 'rising';
  limit?: number;
}

export const fetchLiveOpportunities = async (options: FetchOpportunitiesOptions = {}) => {
  const response = await apiRequest("POST", "/api/fetch-opportunities", options);
  return response.json();
};

export const analyzeOpportunities = async (campaignId: number, limit?: number) => {
  const data = { campaignId, limit };
  const response = await apiRequest("POST", "/api/analyze-opportunities", data);
  return response.json();
};
