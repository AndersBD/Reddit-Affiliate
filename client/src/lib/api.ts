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
